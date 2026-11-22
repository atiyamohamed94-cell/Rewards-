-- شغّله بعد v5. (1) ملف المبدع العام ودعوات المعلنين (2) التقييمات والسمعة (3) نظام الإحالة التجريبي
begin;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reviewer_id uuid not null, reviewee_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (campaign_id, reviewer_id, reviewee_id), check (reviewer_id <> reviewee_id));
create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id);
alter table public.reviews enable row level security;
create policy "reviews read" on public.reviews for select to authenticated using (true);

create table if not exists public.campaign_invites (
  campaign_id uuid not null references public.campaigns(id) on delete cascade, creator_id uuid not null,
  created_at timestamptz not null default now(), primary key (campaign_id, creator_id));
alter table public.campaign_invites enable row level security;

create or replace function public.submit_review(p_campaign uuid, p_reviewee uuid, p_rating int, p_comment text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.campaigns; v_ok boolean := false;
begin
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'التقييم من 1 إلى 5'; end if;
  select * into c from public.campaigns where id = p_campaign;
  if not found then raise exception 'الحملة غير موجودة'; end if;
  if auth.uid() = c.advertiser_id then
    v_ok := exists (select 1 from public.submissions s where s.campaign_id = p_campaign and s.creator_id = p_reviewee and s.status = 'approved');
  elsif p_reviewee = c.advertiser_id then
    v_ok := exists (select 1 from public.submissions s where s.campaign_id = p_campaign and s.creator_id = auth.uid() and s.status = 'approved');
  end if;
  if not v_ok then raise exception 'يمكن التقييم بعد قبول محتوى واحد على الأقل في الحملة'; end if;
  insert into public.reviews (campaign_id, reviewer_id, reviewee_id, rating, comment) values (p_campaign, auth.uid(), p_reviewee, p_rating, left(p_comment, 500));
  insert into public.notifications (user_id, title, message) values (p_reviewee, 'تقييم جديد', 'حصلت على ' || p_rating || ' من 5 في حملة: ' || c.title);
end $$;

create or replace function public.reputation(p_user uuid) returns table (avg_rating numeric, n bigint)
language sql stable security definer set search_path = '' as $$ select round(avg(rating), 1), count(*) from public.reviews where reviewee_id = p_user $$;

create or replace function public.get_creator_kit(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r public.profiles; cp public.creator_profiles;
begin
  select * into r from public.profiles where id = p_id and role = 'creator' and status = 'active';
  if not found then return null; end if;
  select * into cp from public.creator_profiles where user_id = p_id;
  return jsonb_build_object('id', r.id, 'name', coalesce(cp.display_name, r.full_name, 'مبدع'), 'avatar', r.avatar_url, 'bio', r.bio,
    'niches', to_jsonb(coalesce(cp.niches, '{}'::text[])), 'verified', coalesce(cp.verified, false), 'experience', cp.experience,
    'views', (select coalesce(sum(paid_views), 0) from public.submissions where creator_id = p_id and status = 'approved'),
    'videos', (select count(*) from public.submissions where creator_id = p_id and status = 'approved'),
    'campaigns', (select count(distinct campaign_id) from public.submissions where creator_id = p_id and status = 'approved'),
    'socials', (select coalesce(jsonb_agg(jsonb_build_object('platform', platform, 'username', username, 'url', profile_url)), '[]'::jsonb) from public.social_accounts where user_id = p_id),
    'rating', (select jsonb_build_object('avg', round(avg(rating), 1), 'n', count(*)) from public.reviews where reviewee_id = p_id),
    'recent', (select coalesce(jsonb_agg(t.x), '[]'::jsonb) from (select jsonb_build_object('title', c.title, 'brand', c.brand_name) x from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.creator_id = p_id and s.status = 'approved' order by s.submitted_at desc limit 5) t),
    'reviews', (select coalesce(jsonb_agg(t.y), '[]'::jsonb) from (select jsonb_build_object('rating', rv.rating, 'comment', rv.comment) y from public.reviews rv where rv.reviewee_id = p_id order by rv.created_at desc limit 5) t));
end $$;

create or replace function public.search_creators(p_niche text default null, p_q text default null, p_limit int default 20, p_offset int default 0)
returns table (id uuid, name text, avatar text, niches text[], verified boolean, views bigint, videos bigint, rating numeric, rating_n bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles x where x.id = auth.uid() and x.role in ('advertiser','admin')) then raise exception 'غير مصرح'; end if;
  return query select p.id, coalesce(cp.display_name, p.full_name, 'مبدع'), p.avatar_url, coalesce(cp.niches, '{}'::text[]), coalesce(cp.verified, false),
    coalesce((select sum(s.paid_views) from public.submissions s where s.creator_id = p.id and s.status = 'approved'), 0)::bigint,
    (select count(*) from public.submissions s where s.creator_id = p.id and s.status = 'approved')::bigint,
    (select round(avg(r.rating), 1) from public.reviews r where r.reviewee_id = p.id), (select count(*) from public.reviews r where r.reviewee_id = p.id)::bigint
  from public.profiles p left join public.creator_profiles cp on cp.user_id = p.id
  where p.role = 'creator' and p.status = 'active' and (p_niche is null or p_niche = '' or p_niche = any(cp.niches))
    and (p_q is null or p_q = '' or coalesce(cp.display_name, p.full_name, '') ilike '%' || p_q || '%')
  order by 6 desc, 5 desc limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
end $$;

create or replace function public.invite_creator(p_campaign uuid, p_creator uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.campaigns;
begin
  select * into c from public.campaigns where id = p_campaign;
  if not found or c.advertiser_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if c.status <> 'active' then raise exception 'الدعوة متاحة للحملات النشطة فقط'; end if;
  if not exists (select 1 from public.profiles where id = p_creator and role = 'creator' and status = 'active') then raise exception 'المبدع غير متاح'; end if;
  if exists (select 1 from public.campaign_applications where campaign_id = p_campaign and creator_id = p_creator) then raise exception 'المبدع منضم بالفعل'; end if;
  insert into public.campaign_invites (campaign_id, creator_id) values (p_campaign, p_creator);
  insert into public.notifications (user_id, title, message) values (p_creator, 'دعوة لحملة 🎯', 'دعاك ' || c.brand_name || ' للانضمام إلى: ' || c.title || '. افتح "الحملات" وانضم.');
end $$;

create or replace function public.campaign_roster(p_campaign uuid)
returns table (creator_id uuid, name text, verified boolean, approved bigint, my_rating int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.campaigns c where c.id = p_campaign and (c.advertiser_id = auth.uid() or public.is_admin())) then raise exception 'غير مصرح'; end if;
  return query select a.creator_id, coalesce(cp.display_name, p.full_name, 'مبدع'), coalesce(cp.verified, false),
    (select count(*) from public.submissions s where s.campaign_id = p_campaign and s.creator_id = a.creator_id and s.status = 'approved')::bigint,
    (select r.rating from public.reviews r where r.campaign_id = p_campaign and r.reviewer_id = auth.uid() and r.reviewee_id = a.creator_id)
  from public.campaign_applications a join public.profiles p on p.id = a.creator_id left join public.creator_profiles cp on cp.user_id = a.creator_id
  where a.campaign_id = p_campaign and a.status = 'accepted';
end $$;

-- الإحالة (تجريبي: تُسجَّل الدعوات فقط ولا توجد مكافآت مالية)
create or replace function public.my_referral_code() returns text language sql stable security definer set search_path = '' as $$
  select substr(replace(auth.uid()::text, '-', ''), 1, 8) $$;
create or replace function public.claim_referral(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_ref uuid; v_code text := lower(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
begin
  if auth.uid() is null or length(v_code) <> 8 then return false; end if;
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then return false; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and created_at < now() - interval '3 days') then return false; end if;
  select id into v_ref from public.profiles where substr(replace(id::text, '-', ''), 1, 8) = v_code limit 1;
  if v_ref is null or v_ref = auth.uid() then return false; end if;
  insert into public.referrals (referrer_id, referred_id, commission_rate, total_earned) values (v_ref, auth.uid(), 0, 0);
  insert into public.notifications (user_id, title, message) values (v_ref, 'انضم صديق عبر رابطك 🎁', 'سُجّلت دعوتك بنجاح');
  return true;
end $$;
create or replace function public.my_referrals() returns table (joined_at timestamptz, role text, name text)
language sql stable security definer set search_path = '' as $$
  select r.created_at, p.role, coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'مستخدم') from public.referrals r join public.profiles p on p.id = r.referred_id
  where r.referrer_id = auth.uid() order by r.created_at desc $$;
drop policy if exists "admin reads referrals" on public.referrals;
create policy "admin reads referrals" on public.referrals for select using (public.is_admin());

revoke all on function public.submit_review(uuid, uuid, int, text), public.reputation(uuid), public.get_creator_kit(uuid), public.search_creators(text, text, int, int), public.invite_creator(uuid, uuid),
  public.campaign_roster(uuid), public.my_referral_code(), public.claim_referral(text), public.my_referrals() from public, anon;
grant execute on function public.submit_review(uuid, uuid, int, text), public.reputation(uuid), public.get_creator_kit(uuid), public.search_creators(text, text, int, int), public.invite_creator(uuid, uuid),
  public.campaign_roster(uuid), public.my_referral_code(), public.claim_referral(text), public.my_referrals() to authenticated;
commit;
