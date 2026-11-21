-- اختياري: راجعه ثم شغّله بنفسك. لا يغيّر بيانات موجودة.
-- 1) المبدع يقرأ المشاهدات الموثّقة لتسليماته
create policy "Creator reads own view snapshots" on public.view_snapshots for select
using (exists (select 1 from public.submissions s where s.id = view_snapshots.submission_id and s.creator_id = (select auth.uid())));

-- 2) المعلن يوقف/يستأنف حملته (بدون إلغاء لأن الإلغاء يحتاج منطق استرداد)
create or replace function public.set_campaign_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.campaigns;
begin
  if p_status not in ('paused','active') then raise exception 'حالة غير صالحة'; end if;
  select * into c from public.campaigns where id = p_id for update;
  if not found or c.advertiser_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if (p_status = 'paused' and c.status <> 'active') or (p_status = 'active' and c.status <> 'paused')
    then raise exception 'لا يمكن تغيير الحالة'; end if;
  update public.campaigns set status = p_status, updated_at = now() where id = p_id;
end $$;
revoke all on function public.set_campaign_status(uuid, text) from public, anon;
grant execute on function public.set_campaign_status(uuid, text) to authenticated;

-- 3) صور الملف الشخصي
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict do nothing;
create policy "Upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Update own avatar" on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
