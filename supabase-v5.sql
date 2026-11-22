-- شغّله بعد v2 و v3 و v4. (صور الحملات، انضمام فوري، اعتماد المعلن للمشاهدات مع صرف تلقائي، عمولة من الميزانية، حد أدنى للمشاهدات)
begin;

insert into storage.buckets (id, name, public) values ('campaign-images','campaign-images',true) on conflict do nothing;
drop policy if exists "campaign images upload own" on storage.objects;
create policy "campaign images upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'campaign-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- عمولة 15% تلقائية من الميزانية: الميزانية = ما يدفعه المعلن، ويصل للمبدعين 85%
create or replace function public.fund_campaign(p_campaign uuid, p_amount numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare v_c public.campaigns; v_bal numeric; v_fee numeric; v_net numeric; v_paid numeric;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'مبلغ غير صالح'; end if;
  select * into v_c from public.campaigns where id = p_campaign for update;
  if not found or v_c.advertiser_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if v_c.status in ('rejected','completed','cancelled') then raise exception 'لا يمكن تمويل هذه الحملة'; end if;
  select coalesce(sum(-amount), 0) into v_paid from public.wallet_transactions
    where reference_id = p_campaign and transaction_type = 'campaign_funding' and amount < 0;
  if v_paid + p_amount > v_c.budget then raise exception 'المبلغ يتجاوز ميزانية الحملة (المتبقي للتمويل: % جنيه)', v_c.budget - v_paid; end if;
  v_fee := round(p_amount * 0.15, 2); v_net := p_amount - v_fee;
  update public.wallets set available_balance = available_balance - p_amount, updated_at = now()
    where user_id = auth.uid() and available_balance >= p_amount returning available_balance into v_bal;
  if not found then raise exception 'رصيدك غير كافٍ، اشحن رصيدك أولًا'; end if;
  update public.campaigns set funded_amount = funded_amount + v_net, updated_at = now() where id = p_campaign;
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (auth.uid(), 'campaign_funding', -p_amount, 'completed', 'تمويل حملة: ' || v_c.title, p_campaign, v_bal);
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (auth.uid(), 'platform_fee', v_fee, 'completed', 'عمولة المنصة 15% من ميزانية الحملة: ' || v_c.title, p_campaign, v_bal);
end $$;

-- صرف المستحق (داخلي): CPM بعد بلوغ الحد الأدنى للمشاهدات + مكافأة ثابتة مرة واحدة
create or replace function public._pay_submission(p_sub uuid, p_actor uuid) returns numeric
language plpgsql security definer set search_path = '' as $$
declare s public.submissions; c public.campaigns; v_views bigint; v_unpaid bigint; v_cpm numeric := 0; v_fixed numeric := 0; v_total numeric; v_bal numeric; v_min bigint;
begin
  select * into s from public.submissions where id = p_sub for update;
  if not found then raise exception 'التسليم غير موجود'; end if;
  if s.status <> 'approved' then raise exception 'يجب قبول المحتوى أولًا'; end if;
  select * into c from public.campaigns where id = s.campaign_id for update;
  select coalesce(max(views), 0) into v_views from public.view_snapshots where submission_id = p_sub and verified = true;
  v_min := coalesce(nullif(c.requirements->>'min_views', '')::bigint, 0);
  v_unpaid := greatest(v_views - s.paid_views, 0);
  if c.compensation_type in ('cpm','hybrid') and v_views >= v_min then v_cpm := round(v_unpaid / 1000.0 * coalesce(c.cpm_rate, 0), 2); end if;
  if c.compensation_type in ('fixed','hybrid') and not s.fixed_paid then v_fixed := coalesce(c.fixed_reward, 0); end if;
  v_total := v_cpm + v_fixed;
  if v_total <= 0 then raise exception 'لا يوجد مبلغ مستحق حاليًا'; end if;
  if c.funded_amount - c.spent_amount < v_total then raise exception 'رصيد الحملة غير كافٍ لصرف هذا المبلغ'; end if;
  update public.wallets set available_balance = available_balance + v_total, updated_at = now() where user_id = s.creator_id returning available_balance into v_bal;
  if not found then raise exception 'محفظة المبدع غير موجودة'; end if;
  update public.campaigns set spent_amount = spent_amount + v_total, updated_at = now() where id = c.id;
  update public.submissions set paid_views = case when v_cpm > 0 or c.compensation_type = 'fixed' then v_views else paid_views end, fixed_paid = fixed_paid or v_fixed > 0 where id = p_sub;
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after)
    values (s.creator_id, 'earning', v_total, 'completed', 'أرباح حملة: ' || c.title, p_sub, v_bal);
  insert into public.notifications (user_id, title, message) values (s.creator_id, 'تمت إضافة أرباح', 'أُضيف ' || v_total || ' جنيه إلى رصيدك');
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (p_actor, 'pay_submission', 'submission', p_sub, jsonb_build_object('views', v_views, 'cpm', v_cpm, 'fixed', v_fixed, 'total', v_total));
  return v_total;
end $$;
revoke all on function public._pay_submission(uuid, uuid) from public, anon, authenticated;

create or replace function public.admin_pay_submission(p_sub uuid) returns numeric
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  return public._pay_submission(p_sub, auth.uid());
end $$;

-- المعلن يعتمد المشاهدات ويُصرف المستحق تلقائيًا (والأدمن يراقب ويستطيع التدخل)
create or replace function public.advertiser_review_claim(p_id uuid, p_decision text, p_note text) returns numeric
language plpgsql security definer set search_path = '' as $$
declare v public.view_claims; adv uuid; v_title text; v_paid numeric := 0;
begin
  if p_decision not in ('approved','rejected') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.view_claims where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  select c.advertiser_id, c.title into adv, v_title from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.id = v.submission_id;
  if adv is distinct from auth.uid() then raise exception 'غير مصرح'; end if;
  if v.status <> 'pending' then raise exception 'تمت مراجعة الطلب مسبقًا'; end if;
  if p_decision = 'approved' then
    insert into public.view_snapshots (submission_id, views, verified, source, evidence_url) values (v.submission_id, v.claimed_views, true, 'creator_claim_advertiser', v.proof_path);
  end if;
  update public.view_claims set status = p_decision, advertiser_check = case p_decision when 'approved' then 'confirmed' else 'disputed' end,
    advertiser_note = left(p_note, 500), reviewed_at = now(), reviewed_by = auth.uid() where id = p_id;
  if p_decision = 'approved' then
    begin v_paid := public._pay_submission(v.submission_id, auth.uid());
    exception when others then if position('لا يوجد مبلغ' in sqlerrm) = 0 then raise; end if; end;
  end if;
  insert into public.notifications (user_id, title, message) values (v.creator_id,
    case p_decision when 'approved' then 'تم اعتماد مشاهداتك' else 'تم رفض طلب المشاهدات' end,
    coalesce(p_note, case p_decision when 'approved' then case when v_paid > 0 then 'أُضيف ' || v_paid || ' جنيه لرصيدك' else 'تم تسجيل المشاهدات' end else v_title end));
  insert into public.notifications (user_id, title, message) select id, 'معلن راجع طلب مشاهدات (للعلم)', v_title || ' - ' || p_decision || ' - ' || v_paid || ' جنيه' from public.profiles where role = 'admin';
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (auth.uid(), 'advertiser_claim_' || p_decision, 'view_claim', p_id, jsonb_build_object('views', v.claimed_views, 'paid', v_paid));
  return v_paid;
end $$;
revoke all on function public.advertiser_review_claim(uuid, text, text) from public, anon;
grant execute on function public.advertiser_review_claim(uuid, text, text) to authenticated;

-- الأدمن عند اعتماده يصرف تلقائيًا أيضًا
create or replace function public.admin_review_claim(p_id uuid, p_decision text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.view_claims; v_paid numeric := 0;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'قرار غير صالح'; end if;
  select * into v from public.view_claims where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if v.status <> 'pending' then raise exception 'تمت مراجعة الطلب مسبقًا'; end if;
  if p_decision = 'approved' then
    insert into public.view_snapshots (submission_id, views, verified, source, evidence_url) values (v.submission_id, v.claimed_views, true, 'creator_claim_admin', v.proof_path);
  end if;
  update public.view_claims set status = p_decision, admin_note = p_note, reviewed_at = now(), reviewed_by = auth.uid() where id = p_id;
  if p_decision = 'approved' then
    begin v_paid := public._pay_submission(v.submission_id, auth.uid());
    exception when others then if position('لا يوجد مبلغ' in sqlerrm) = 0 then raise; end if; end;
  end if;
  insert into public.notifications (user_id, title, message) values (v.creator_id,
    case p_decision when 'approved' then 'تم اعتماد مشاهداتك' else 'تم رفض طلب المشاهدات' end,
    coalesce(p_note, case p_decision when 'approved' then case when v_paid > 0 then 'أُضيف ' || v_paid || ' جنيه لرصيدك' else 'تم تسجيل المشاهدات' end else 'تواصل مع الدعم للتفاصيل' end));
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
    values (auth.uid(), 'claim_' || p_decision, 'view_claim', p_id, jsonb_build_object('views', v.claimed_views, 'paid', v_paid, 'note', p_note));
end $$;

-- المكافأة الثابتة (UGC) تُصرف تلقائيًا عند قبول المحتوى؛ عند فشلها (رصيد الحملة) يُنبَّه المعلن
create or replace function public.trg_auto_fixed() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_adv uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    begin perform public._pay_submission(new.id, null);
    exception when others then
      if position('لا يوجد مبلغ' in sqlerrm) = 0 then
        select advertiser_id into v_adv from public.campaigns where id = new.campaign_id;
        insert into public.notifications (user_id, title, message) values (v_adv, 'تعذّر صرف مكافأة مبدع', sqlerrm);
      end if;
    end;
  end if;
  return new;
end $$;
drop trigger if exists n_auto_fixed on public.submissions;
create trigger n_auto_fixed after update of status on public.submissions for each row execute function public.trg_auto_fixed();

-- انضمام فوري للحملة (أو بموافقة المعلن لو اختار ذلك) + دخول المجتمع تلقائيًا
create or replace function public.join_campaign(p_campaign uuid, p_message text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare c public.campaigns; v_count int; v_status text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'creator' and status = 'active') then raise exception 'الانضمام للمبدعين فقط'; end if;
  select * into c from public.campaigns where id = p_campaign;
  if not found or c.status <> 'active' then raise exception 'الحملة غير متاحة'; end if;
  v_status := case when coalesce(c.requirements->>'approval', 'auto') = 'manual' then 'pending' else 'accepted' end;
  if v_status = 'accepted' then
    select count(*) into v_count from public.campaign_applications where campaign_id = p_campaign and status = 'accepted';
    if v_count >= coalesce(c.creators_needed, 1) then raise exception 'اكتمل عدد المبدعين المطلوب'; end if;
  end if;
  insert into public.campaign_applications (campaign_id, creator_id, message, status) values (p_campaign, auth.uid(), left(p_message, 1000), v_status);
  return v_status;
end $$;
revoke all on function public.join_campaign(uuid, text) from public, anon;
grant execute on function public.join_campaign(uuid, text) to authenticated;

create or replace function public.trg_join_community() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'accepted' then
    insert into public.community_members (community_id, user_id) select id, new.creator_id from public.communities where campaign_id = new.campaign_id on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists n_join_comm on public.campaign_applications;
create trigger n_join_comm after insert or update of status on public.campaign_applications for each row execute function public.trg_join_community();

-- المعلن يدخل مجتمع حملته تلقائيًا
create or replace function public.create_campaign_community() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if new.status = 'active' and not exists (select 1 from public.communities where campaign_id = new.id) then
    insert into public.communities (campaign_id, name, description, is_general) values (new.id, 'مجتمع: ' || new.title, 'نقاش خاص بالحملة', false) returning id into v_id;
    insert into public.community_members (community_id, user_id) values (v_id, new.advertiser_id) on conflict do nothing;
  end if;
  return new;
end $$;

-- تعبئة للبيانات الحالية
insert into public.community_members (community_id, user_id)
  select m.id, a.creator_id from public.communities m join public.campaign_applications a on a.campaign_id = m.campaign_id where a.status = 'accepted' on conflict do nothing;
insert into public.community_members (community_id, user_id)
  select m.id, c.advertiser_id from public.communities m join public.campaigns c on c.id = m.campaign_id on conflict do nothing;
commit;
