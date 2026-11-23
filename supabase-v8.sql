-- شغّله بعد v7. (1) بطاقة المعلن وبيانات التواصل بين الطرفين (2) اشتراط رقم هاتف قبل الانضمام/التمويل (3) التأكد أن حاويات الصور عامة
begin;
update storage.buckets set public = true where id in ('avatars', 'campaign-images');

create or replace function public.get_contact(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_ok boolean;
begin
  if auth.uid() is null then raise exception 'غير مصرح'; end if;
  v_ok := public.is_admin() or exists (
    select 1 from public.campaign_applications a join public.campaigns c on c.id = a.campaign_id
    where a.status = 'accepted' and ((c.advertiser_id = auth.uid() and a.creator_id = p_user) or (a.creator_id = auth.uid() and c.advertiser_id = p_user)));
  if not v_ok then raise exception 'غير مصرح'; end if;
  return (select jsonb_build_object('name', coalesce(nullif(full_name, ''), email), 'phone', phone, 'role', role) from public.profiles where id = p_user);
end $$;

create or replace function public.get_advertiser_card(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', p.full_name, 'avatar', p.avatar_url, 'bio', p.bio, 'business', ap.business_name, 'type', ap.business_type, 'website', ap.website, 'verified', coalesce(ap.verified, false))
  from public.profiles p left join public.advertiser_profiles ap on ap.user_id = p.id where p.id = p_id and p.role = 'advertiser' $$;
revoke all on function public.get_contact(uuid), public.get_advertiser_card(uuid) from public, anon;
grant execute on function public.get_contact(uuid), public.get_advertiser_card(uuid) to authenticated;

create or replace function public.join_campaign(p_campaign uuid, p_message text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare c public.campaigns; v_count int; v_status text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'creator' and status = 'active') then raise exception 'الانضمام للمبدعين فقط'; end if;
  if coalesce((select nullif(phone, '') from public.profiles where id = auth.uid()), '') = '' then raise exception 'أضف رقم هاتفك في "حسابي" أولًا ليتواصل معك المعلن عند الحاجة'; end if;
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

create or replace function public.fund_campaign(p_campaign uuid, p_amount numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare v_c public.campaigns; v_bal numeric; v_fee numeric; v_net numeric; v_paid numeric;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'مبلغ غير صالح'; end if;
  if coalesce((select nullif(phone, '') from public.profiles where id = auth.uid()), '') = '' then raise exception 'أضف رقم هاتفك في "حسابي" أولًا ليتواصل معك المبدعون عند الحاجة'; end if;
  select * into v_c from public.campaigns where id = p_campaign for update;
  if not found or v_c.advertiser_id <> auth.uid() then raise exception 'غير مصرح'; end if;
  if v_c.status in ('rejected','completed','cancelled') then raise exception 'لا يمكن تمويل هذه الحملة'; end if;
  select coalesce(sum(-amount), 0) into v_paid from public.wallet_transactions where reference_id = p_campaign and transaction_type = 'campaign_funding' and amount < 0;
  if v_paid + p_amount > v_c.budget then raise exception 'المبلغ يتجاوز ميزانية الحملة (المتبقي للتمويل: % جنيه)', v_c.budget - v_paid; end if;
  v_fee := round(p_amount * 0.15, 2); v_net := p_amount - v_fee;
  update public.wallets set available_balance = available_balance - p_amount, updated_at = now() where user_id = auth.uid() and available_balance >= p_amount returning available_balance into v_bal;
  if not found then raise exception 'رصيدك غير كافٍ، اشحن رصيدك أولًا'; end if;
  update public.campaigns set funded_amount = funded_amount + v_net, updated_at = now() where id = p_campaign;
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after) values (auth.uid(), 'campaign_funding', -p_amount, 'completed', 'تمويل حملة: ' || v_c.title, p_campaign, v_bal);
  insert into public.wallet_transactions (user_id, transaction_type, amount, status, description, reference_id, balance_after) values (auth.uid(), 'platform_fee', v_fee, 'completed', 'عمولة المنصة 15% من ميزانية الحملة: ' || v_c.title, p_campaign, v_bal);
end $$;
commit;
