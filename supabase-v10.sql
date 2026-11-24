-- v10: دالة عامة تعرض بيانات الحملة النشطة فقط (بدون أي أرقام مالية أو بيانات المعلن الداخلية)
-- تُستخدم في صفحة /c/<id> التي يفتحها أي زائر من غير حساب.
create or replace function public.public_campaign(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'brand_name', c.brand_name, 'description', c.description,
    'campaign_type', c.campaign_type, 'compensation_type', c.compensation_type,
    'fixed_reward', c.fixed_reward, 'cpm_rate', c.cpm_rate, 'platforms', c.platforms,
    'creators_needed', c.creators_needed, 'application_requirements', c.application_requirements,
    'image_url', c.image_url)
  from public.campaigns c where c.id = p_id and c.status = 'active';
$$;
revoke all on function public.public_campaign(uuid) from public;
grant execute on function public.public_campaign(uuid) to anon, authenticated;
