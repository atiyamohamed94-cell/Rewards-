-- شغّله بعد v6. توثيق ملكية حسابات السوشيال: كود يضعه المبدع في وصف حسابه، والأدمن يتحقق ويوثّق.
begin;
create table if not exists public.social_verifications (
  social_account_id uuid primary key references public.social_accounts(id) on delete cascade,
  user_id uuid not null, code text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  admin_note text, created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid);
alter table public.social_verifications enable row level security;
create policy "own or admin reads social verifications" on public.social_verifications for select using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.request_social_verification(p_account uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare a public.social_accounts; v_code text; v_old public.social_verifications;
begin
  select * into a from public.social_accounts where id = p_account;
  if not found or a.user_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  select * into v_old from public.social_verifications where social_account_id = p_account;
  if found and v_old.status = 'verified' then raise exception 'الحساب موثّق بالفعل'; end if;
  if found and v_old.status = 'pending' then return v_old.code; end if;
  v_code := 'CH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  insert into public.social_verifications (social_account_id, user_id, code) values (p_account, auth.uid(), v_code)
    on conflict (social_account_id) do update set code = excluded.code, status = 'pending', admin_note = null, created_at = now(), reviewed_at = null, reviewed_by = null;
  insert into public.notifications (user_id, title, message) select id, 'طلب توثيق حساب سوشيال', a.platform || ' @' || a.username from public.profiles where role = 'admin';
  return v_code;
end $$;

create or replace function public.admin_pending_socials()
returns table (account_id uuid, user_id uuid, user_name text, platform text, username text, profile_url text, code text, requested_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  return query select a.id, a.user_id, coalesce(p.full_name, p.email), a.platform, a.username, a.profile_url, v.code, v.created_at
    from public.social_verifications v join public.social_accounts a on a.id = v.social_account_id join public.profiles p on p.id = a.user_id
    where v.status = 'pending' order by v.created_at;
end $$;

create or replace function public.admin_review_social(p_account uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.social_verifications;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_decision not in ('verified','rejected') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.social_verifications where social_account_id = p_account for update;
  if not found or v.status <> 'pending' then raise exception 'لا يوجد طلب معلّق'; end if;
  update public.social_verifications set status = p_decision, admin_note = p_note, reviewed_at = now(), reviewed_by = auth.uid() where social_account_id = p_account;
  insert into public.notifications (user_id, title, message) values (v.user_id,
    case p_decision when 'verified' then 'تم توثيق حسابك ✓' else 'تعذّر توثيق حسابك' end,
    coalesce(p_note, case p_decision when 'verified' then 'يمكنك حذف الكود من وصف حسابك الآن' else 'تأكد أن الكود ظاهر في وصف الحساب ثم اطلب التوثيق مجددًا' end));
  insert into public.admin_logs (admin_id, action, target_type, target_id, details) values (auth.uid(), 'social_' || p_decision, 'social_account', p_account, jsonb_build_object('note', p_note));
end $$;

create or replace function public.creator_verified_socials(p_creator uuid) returns table (platform text, username text, profile_url text)
language sql stable security definer set search_path = '' as $$
  select a.platform, a.username, a.profile_url from public.social_accounts a join public.social_verifications v on v.social_account_id = a.id
  where a.user_id = p_creator and v.status = 'verified' $$;

revoke all on function public.request_social_verification(uuid), public.admin_pending_socials(), public.admin_review_social(uuid, text, text), public.creator_verified_socials(uuid) from public, anon;
grant execute on function public.request_social_verification(uuid), public.admin_pending_socials(), public.admin_review_social(uuid, text, text), public.creator_verified_socials(uuid) to authenticated;
commit;
