-- شغّله بعد supabase-v2.sql. نظام طلبات توثيق المشاهدات: المبدع يطلب، المعلن يؤكد أو يعترض، الأدمن يقرر، ثم الصرف بدالتك الحالية.
begin;
create table if not exists public.view_claims (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  creator_id uuid not null,
  claimed_views bigint not null check (claimed_views > 0),
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  advertiser_check text check (advertiser_check in ('confirmed','disputed')),
  advertiser_note text, admin_note text,
  created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid
);
create index if not exists view_claims_sub_idx on public.view_claims (submission_id);
create index if not exists view_claims_status_idx on public.view_claims (status);
alter table public.view_claims enable row level security;
create policy "claims read" on public.view_claims for select using (
  creator_id = (select auth.uid()) or public.is_admin()
  or exists (select 1 from public.submissions s join public.campaigns c on c.id = s.campaign_id
             where s.id = view_claims.submission_id and c.advertiser_id = (select auth.uid())));

insert into storage.buckets (id, name, public) values ('view-proofs','view-proofs',false) on conflict do nothing;
create policy "view proofs upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'view-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "view proofs read" on storage.objects for select to authenticated using (
  bucket_id = 'view-proofs' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()
  or exists (select 1 from public.view_claims vc join public.submissions s on s.id = vc.submission_id
             join public.campaigns k on k.id = s.campaign_id where vc.proof_path = name and k.advertiser_id = (select auth.uid()))));

create or replace function public.submit_view_claim(p_submission uuid, p_views bigint, p_proof text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s public.submissions; v_known bigint; v_id uuid; v_adv uuid; v_title text;
begin
  select * into s from public.submissions where id = p_submission;
  if not found or s.creator_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if s.status <> 'approved' then raise exception 'يجب قبول المحتوى أولًا'; end if;
  if p_views is null or p_views <= 0 then raise exception 'عدد غير صالح'; end if;
  if p_proof is null or p_proof not like auth.uid()::text || '/%' then raise exception 'إثبات غير صالح'; end if;
  select coalesce(max(views), 0) into v_known from public.view_snapshots where submission_id = p_submission and verified;
  if p_views <= greatest(v_known, s.paid_views) then raise exception 'العدد يجب أن يكون أكبر من المشاهدات الموثّقة سابقًا'; end if;
  if exists (select 1 from public.view_claims where submission_id = p_submission and status = 'pending') then raise exception 'لديك طلب قيد المراجعة'; end if;
  insert into public.view_claims (submission_id, creator_id, claimed_views, proof_path) values (p_submission, auth.uid(), p_views, p_proof) returning id into v_id;
  select c.advertiser_id, c.title into v_adv, v_title from public.campaigns c where c.id = s.campaign_id;
  insert into public.notifications (user_id, title, message) values (v_adv, 'طلب توثيق مشاهدات', 'مبدع أرسل مشاهدات جديدة في حملة: ' || v_title);
  insert into public.notifications (user_id, title, message) select id, 'طلب توثيق مشاهدات جديد', v_title from public.profiles where role = 'admin';
  return v_id;
end $$;

create or replace function public.advertiser_check_claim(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.view_claims; adv uuid;
begin
  if p_decision not in ('confirmed','disputed') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.view_claims where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  select c.advertiser_id into adv from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.id = v.submission_id;
  if adv is distinct from auth.uid() then raise exception 'غير مصرح'; end if;
  if v.status <> 'pending' then raise exception 'تمت مراجعة الطلب'; end if;
  update public.view_claims set advertiser_check = p_decision, advertiser_note = left(p_note, 500) where id = p_id;
  insert into public.notifications (user_id, title, message) select id, 'رد المعلن على طلب مشاهدات', case p_decision when 'confirmed' then 'المعلن أكّد الرقم' else 'المعلن اعترض على الرقم' end from public.profiles where role = 'admin';
end $$;

create or replace function public.admin_review_claim(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.view_claims;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.view_claims where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if v.status <> 'pending' then raise exception 'تمت مراجعة الطلب مسبقًا'; end if;
  if p_decision = 'approved' then
    insert into public.view_snapshots (submission_id, views, verified, source, evidence_url) values (v.submission_id, v.claimed_views, true, 'creator_claim', v.proof_path);
  end if;
  update public.view_claims set status = p_decision, admin_note = p_note, reviewed_at = now(), reviewed_by = auth.uid() where id = p_id;
  insert into public.notifications (user_id, title, message) values (v.creator_id,
    case p_decision when 'approved' then 'تم اعتماد مشاهداتك' else 'تم رفض طلب المشاهدات' end,
    coalesce(p_note, case p_decision when 'approved' then 'سيتم صرف المستحق قريبًا' else 'تواصل مع الدعم للتفاصيل' end));
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (auth.uid(), 'claim_' || p_decision, 'view_claim', p_id, jsonb_build_object('views', v.claimed_views, 'note', p_note));
end $$;

revoke all on function public.submit_view_claim(uuid, bigint, text), public.advertiser_check_claim(uuid, text, text), public.admin_review_claim(uuid, text, text) from public, anon;
grant execute on function public.submit_view_claim(uuid, bigint, text), public.advertiser_check_claim(uuid, text, text), public.admin_review_claim(uuid, text, text) to authenticated;
commit;
