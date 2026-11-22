-- شغّله بنفسك في SQL Editor بعد المراجعة (داخل معاملة واحدة). يعدّل دوال مالية: خذ نسخة احتياطية أولًا.
begin;

-- 1) عمولة المعلن 15% عند تمويل الحملة (الميزانية = ما يصل للمبدعين)
create or replace function public.fund_campaign(p_campaign uuid, p_amount numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare v_c public.campaigns; v_bal numeric; v_fee numeric; v_net numeric;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'مبلغ غير صالح'; end if;
  select * into v_c from public.campaigns where id = p_campaign for update;
  if not found or v_c.advertiser_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if v_c.status in ('rejected','completed') then raise exception 'لا يمكن تمويل هذه الحملة'; end if;
  v_fee := round(p_amount * 0.15, 2); v_net := p_amount - v_fee;
  if v_c.funded_amount + v_net > v_c.budget then raise exception 'المبلغ يتجاوز ميزانية الحملة'; end if;
  update public.wallets set available_balance = available_balance - p_amount, updated_at = now()
    where user_id = auth.uid() and available_balance >= p_amount returning available_balance into v_bal;
  if not found then raise exception 'رصيدك غير كافٍ'; end if;
  update public.campaigns set funded_amount = funded_amount + v_net, updated_at = now() where id = p_campaign;
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (auth.uid(), 'campaign_funding', -p_amount, 'completed', 'تمويل حملة: ' || v_c.title, p_campaign, v_bal);
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (auth.uid(), 'platform_fee', v_fee, 'completed', 'عمولة المنصة 15% - تمويل حملة: ' || v_c.title, p_campaign, v_bal);
end; $$;

-- 2) رسوم المبدع 5% عند السحب (تُحفظ في payment_details وتُسجَّل كإيراد عند التنفيذ)
create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_details jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_bal numeric; v_fee numeric; v_net numeric;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'creator' and status = 'active') then
    raise exception 'السحب متاح للمبدعين فقط'; end if;
  if p_method not in ('instapay','ewallet') then raise exception 'طريقة سحب غير مدعومة'; end if;
  if p_amount is null or p_amount < 50 then raise exception 'الحد الأدنى للسحب 50 جنيهًا'; end if;
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
end; $$;

create or replace function public.admin_review_withdrawal(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.withdrawal_requests; v_bal numeric; v_fee numeric;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.withdrawal_requests where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if v.status <> 'pending' then raise exception 'تمت مراجعة الطلب مسبقًا'; end if;
  if v.user_id = auth.uid() then raise exception 'لا يمكنك مراجعة سحبك بنفسك'; end if;
  if p_decision = 'approved' then
    update public.wallets set pending_balance = pending_balance - v.amount, updated_at = now() where user_id = v.user_id;
    update public.wallet_transactions set status = 'completed' where reference_id = p_id and transaction_type = 'withdrawal';
    v_fee := coalesce((v.payment_details->>'fee')::numeric, 0);
    if v_fee > 0 then
      insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id)
        values (v.user_id, 'platform_fee', v_fee, 'completed', 'رسوم سحب 5%', p_id);
    end if;
  else
    update public.wallets set pending_balance = pending_balance - v.amount, available_balance = available_balance + v.amount, updated_at = now()
      where user_id = v.user_id returning available_balance into v_bal;
    update public.wallet_transactions set status = 'rejected' where reference_id = p_id and transaction_type = 'withdrawal';
    insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
      values (v.user_id, 'withdrawal_refund', v.amount, 'completed', 'استرداد سحب مرفوض', p_id, v_bal);
  end if;
  update public.withdrawal_requests set status = p_decision, admin_note = p_note, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  insert into public.notifications (user_id, title, message) values (v.user_id,
    case p_decision when 'approved' then 'تم تنفيذ طلب السحب' else 'تم رفض طلب السحب' end,
    coalesce(p_note, case p_decision when 'approved' then 'تم تحويل ' || coalesce(v.payment_details->>'net', v.amount::text) || ' جنيه (بعد الرسوم)' else 'أُعيد ' || v.amount || ' جنيه إلى رصيدك' end));
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (auth.uid(), 'withdrawal_' || p_decision, 'withdrawal_request', p_id, jsonb_build_object('amount', v.amount, 'fee', v_fee, 'note', p_note));
end; $$;

-- 3) لوحة المتصدرين (لا تكشف أي بيانات مالية)
create or replace function public.get_leaderboard(p_period text default 'all', p_limit int default 20)
returns table (pos bigint, creator_id uuid, display_name text, verified boolean, total_views bigint, approved_videos bigint)
language sql stable security definer set search_path = '' as $$
  select row_number() over (order by sum(s.paid_views) desc, count(*) desc), s.creator_id,
         coalesce(cp.display_name, p.full_name, 'مبدع'), coalesce(cp.verified, false), sum(s.paid_views)::bigint, count(*)::bigint
  from public.submissions s join public.profiles p on p.id = s.creator_id left join public.creator_profiles cp on cp.user_id = s.creator_id
  where s.status = 'approved' and p.status = 'active' and (p_period <> 'month' or s.submitted_at >= date_trunc('month', now()))
  group by s.creator_id, cp.display_name, p.full_name, cp.verified
  having sum(s.paid_views) > 0
  order by 5 desc limit least(greatest(p_limit, 1), 50)
$$;
revoke all on function public.get_leaderboard(text, int) from public, anon;
grant execute on function public.get_leaderboard(text, int) to authenticated;

-- 4) إشعارات الأحداث التي لا تُرسل لها دوالك الحالية إشعارًا (لتفادي التكرار)
create or replace function public.notify_admins(p_title text, p_msg text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, message) select id, p_title, p_msg from public.profiles where role = 'admin' $$;
revoke all on function public.notify_admins(text, text) from public, anon, authenticated;

create or replace function public.trg_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_adv uuid;
begin
  if tg_table_name = 'campaign_applications' then
    select advertiser_id into v_adv from public.campaigns where id = new.campaign_id;
    insert into public.notifications (user_id, title, message) values (v_adv, 'طلب انضمام جديد', 'تقدّم مبدع على حملتك');
  elsif tg_table_name = 'submissions' then
    if tg_op = 'INSERT' or (new.status = 'pending' and old.status is distinct from 'pending') then
      select advertiser_id into v_adv from public.campaigns where id = new.campaign_id;
      insert into public.notifications (user_id, title, message) values (v_adv, 'تسليم جديد للمراجعة', 'هناك محتوى ينتظر مراجعتك');
    end if;
  elsif tg_table_name = 'campaigns' then
    if new.status = 'pending' and old.status is distinct from 'pending' then perform public.notify_admins('حملة بانتظار الاعتماد', new.title); end if;
  elsif tg_table_name = 'payment_requests' then
    perform public.notify_admins('طلب شحن جديد', new.amount || ' جنيه - ' || new.method);
    insert into public.notifications (user_id, title, message) values (new.user_id, 'تم استلام طلب الشحن', 'سنراجعه قريبًا');
  elsif tg_table_name = 'withdrawal_requests' then
    perform public.notify_admins('طلب سحب جديد', new.amount || ' جنيه');
    insert into public.notifications (user_id, title, message) values (new.user_id, 'تم استلام طلب السحب', 'سنراجعه قريبًا');
  elsif tg_table_name = 'disputes' then
    perform public.notify_admins('بلاغ/طلب جديد', new.subject);
  elsif tg_table_name = 'wallet_transactions' then
    insert into public.notifications (user_id, title, message) values (new.user_id, 'تم تمويل الحملة', 'خُصم ' || abs(new.amount) || ' جنيه من رصيدك');
  elsif tg_table_name in ('creator_profiles','advertiser_profiles') then
    if new.verified and not coalesce(old.verified, false) then
      insert into public.notifications (user_id, title, message) values (new.user_id, 'تم توثيق حسابك ✓', 'أصبح حسابك موثّقًا');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists n_app on public.campaign_applications;
create trigger n_app after insert on public.campaign_applications for each row execute function public.trg_notify();
drop trigger if exists n_sub on public.submissions;
create trigger n_sub after insert or update of status on public.submissions for each row execute function public.trg_notify();
drop trigger if exists n_camp on public.campaigns;
create trigger n_camp after update of status on public.campaigns for each row execute function public.trg_notify();
drop trigger if exists n_pay on public.payment_requests;
create trigger n_pay after insert on public.payment_requests for each row execute function public.trg_notify();
drop trigger if exists n_wd on public.withdrawal_requests;
create trigger n_wd after insert on public.withdrawal_requests for each row execute function public.trg_notify();
drop trigger if exists n_dis on public.disputes;
create trigger n_dis after insert on public.disputes for each row execute function public.trg_notify();
drop trigger if exists n_fund on public.wallet_transactions;
create trigger n_fund after insert on public.wallet_transactions for each row when (new.transaction_type = 'campaign_funding') execute function public.trg_notify();
drop trigger if exists n_ver_c on public.creator_profiles;
create trigger n_ver_c after update of verified on public.creator_profiles for each row execute function public.trg_notify();
drop trigger if exists n_ver_a on public.advertiser_profiles;
create trigger n_ver_a after update of verified on public.advertiser_profiles for each row execute function public.trg_notify();

commit;
