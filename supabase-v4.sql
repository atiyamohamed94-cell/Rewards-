-- شغّله بعد v2 و v3. (1) إرجاع المتبقي عند إنهاء الحملة (2) منع تكرار الفيديو (3) احتجاز الأرباح 72 ساعة قبل السحب.
begin;

-- 1) إنهاء/إلغاء حملة (للأدمن فقط) مع إرجاع المتبقي غير المصروف لمحفظة المعلن. العمولة المخصومة سابقًا لا تُرجَع.
create or replace function public.close_campaign(p_id uuid, p_status text default 'completed') returns numeric
language plpgsql security definer set search_path = '' as $$
declare c public.campaigns; v_rem numeric; v_bal numeric;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_status not in ('completed','cancelled') then raise exception 'حالة غير صالحة'; end if;
  select * into c from public.campaigns where id = p_id for update;
  if not found then raise exception 'الحملة غير موجودة'; end if;
  if c.status in ('completed','cancelled') then raise exception 'الحملة منتهية بالفعل'; end if;
  if exists (select 1 from public.view_claims vc join public.submissions s on s.id = vc.submission_id
             where s.campaign_id = p_id and vc.status = 'pending') then raise exception 'يوجد طلبات مشاهدات معلّقة، راجعها أولًا'; end if;
  v_rem := greatest(c.funded_amount - c.spent_amount, 0);
  if v_rem > 0 then
    update public.wallets set available_balance = available_balance + v_rem, updated_at = now()
      where user_id = c.advertiser_id returning available_balance into v_bal;
    if not found then raise exception 'محفظة المعلن غير موجودة'; end if;
    insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
      values (c.advertiser_id, 'refund', v_rem, 'completed', 'استرداد المتبقي من حملة: ' || c.title, p_id, v_bal);
  end if;
  update public.campaigns set status = p_status, funded_amount = case when v_rem > 0 then spent_amount else funded_amount end, updated_at = now() where id = p_id;
  insert into public.notifications (user_id, title, message) values (c.advertiser_id,
    case p_status when 'completed' then 'تم إنهاء حملتك' else 'تم إلغاء حملتك' end,
    case when v_rem > 0 then 'أُعيد ' || v_rem || ' جنيه إلى رصيدك' else c.title end);
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (auth.uid(), 'campaign_' || p_status, 'campaign', p_id, jsonb_build_object('refunded', v_rem));
  return v_rem;
end $$;
revoke all on function public.close_campaign(uuid, text) from public, anon;
grant execute on function public.close_campaign(uuid, text) to authenticated;

-- 2) منع تسليم نفس الفيديو مرتين (الروابط المختصرة مثل vm.tiktok.com لا يمكن توحيدها)
create or replace function public.norm_url(u text) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(case when lower(u) ~ 'youtube\.com/watch'
    then regexp_replace(lower(trim(u)), '^(.*[?&]v=[^&#]+).*$', '\1')
    else regexp_replace(split_part(split_part(lower(trim(u)), '#', 1), '?', 1), '/+$', '') end, '^https?://(www\.|m\.)?', '') $$;
create index if not exists submissions_normurl_idx on public.submissions (public.norm_url(content_url));
create or replace function public.trg_unique_video() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.submissions s where s.id <> new.id and s.status <> 'rejected'
             and public.norm_url(s.content_url) = public.norm_url(new.content_url)) then
    raise exception 'هذا الفيديو سُلِّم من قبل على المنصة';
  end if;
  return new;
end $$;
drop trigger if exists u_video on public.submissions;
create trigger u_video before insert or update of content_url on public.submissions for each row execute function public.trg_unique_video();

-- 3) أرباح آخر 72 ساعة محجوزة ولا تُسحب إلا بعدها
create or replace function public.my_withdrawable() returns numeric language sql stable security definer set search_path = '' as $$
  select greatest(coalesce((select available_balance from public.wallets where user_id = auth.uid()), 0)
    - coalesce((select sum(amount) from public.wallet_transactions where user_id = auth.uid() and transaction_type = 'earning'
                and status = 'completed' and created_at > now() - interval '72 hours'), 0), 0) $$;
revoke all on function public.my_withdrawable() from public, anon;
grant execute on function public.my_withdrawable() to authenticated;

create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_details jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_bal numeric; v_fee numeric; v_net numeric; v_ok numeric;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'creator' and status = 'active') then
    raise exception 'السحب متاح للمبدعين فقط'; end if;
  if p_method not in ('instapay','ewallet') then raise exception 'طريقة سحب غير مدعومة'; end if;
  if p_amount is null or p_amount < 50 then raise exception 'الحد الأدنى للسحب 50 جنيهًا'; end if;
  v_ok := public.my_withdrawable();
  if p_amount > v_ok then raise exception 'المتاح للسحب الآن % جنيه (الأرباح الجديدة تُحتجز 72 ساعة)', v_ok; end if;
  v_fee := round(p_amount * 0.05, 2); v_net := p_amount - v_fee;
  update public.wallets set available_balance = available_balance - p_amount, pending_balance = pending_balance + p_amount, updated_at = now()
    where user_id = auth.uid() and available_balance >= p_amount returning available_balance into v_bal;
  if not found then raise exception 'رصيدك غير كافٍ'; end if;
  insert into public.withdrawal_requests (user_id, amount, payment_method, payment_details)
    values (auth.uid(), p_amount, p_method, coalesce(p_details, '{}'::jsonb) || jsonb_build_object('gross', p_amount, 'fee', v_fee, 'net', v_net, 'currency', 'EGP'))
    returning id into v_id;
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (auth.uid(), 'withdrawal', -p_amount, 'pending', 'طلب سحب', v_id, v_bal);
  return v_id;
end $$;
commit;
