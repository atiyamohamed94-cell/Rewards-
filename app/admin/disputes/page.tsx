import { sb } from '@/lib/server'
import { RoleChangeActions } from '@/components/Forms'

export default async function P() {
  const s = await sb()

  const { data: requests, error } = await s
    .from('disputes')
    .select('id, reporter_id, subject, details, status, admin_note, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="card">تعذر تحميل الطلبات: {error.message}</div>
  }

  const userIds = [...new Set((requests || []).map((r: any) => r.reporter_id).filter(Boolean))]

  const [profilesResult, creatorsResult, advertisersResult, socialsResult] = userIds.length
    ? await Promise.all([
        s.from('profiles')
          .select('id, role, full_name, email, phone, status, avatar_url')
          .in('id', userIds),
        s.from('creator_profiles')
          .select('user_id, display_name, niches, experience, verified')
          .in('user_id', userIds),
        s.from('advertiser_profiles')
          .select('user_id, business_name, business_type, website, verified')
          .in('user_id', userIds),
        s.from('social_accounts')
          .select('id, user_id, platform, username, profile_url')
          .in('user_id', userIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]

  const profiles = Object.fromEntries((profilesResult.data || []).map((p: any) => [p.id, p]))
  const creators = Object.fromEntries((creatorsResult.data || []).map((p: any) => [p.user_id, p]))
  const advertisers = Object.fromEntries((advertisersResult.data || []).map((p: any) => [p.user_id, p]))
  const socialsByUser: Record<string, any[]> = {}

  for (const account of socialsResult.data || []) {
    socialsByUser[account.user_id] ||= []
    socialsByUser[account.user_id].push(account)
  }

  const roleLabel = (role?: string) =>
    role === 'creator' ? 'صانع محتوى' : role === 'advertiser' ? 'معلن' : role || 'غير معروف'

  return (
    <>
      <h2>طلبات تغيير نوع الحساب</h2>
      <p className="mu">راجع بيانات صاحب الطلب ونوع الحساب الحالي والمطلوب قبل اتخاذ القرار.</p>

      {!requests?.length && <div className="card mu">لا توجد طلبات حاليًا.</div>}

      {requests?.map((request: any) => {
        const user = profiles[request.reporter_id]
        const creator = creators[request.reporter_id]
        const advertiser = advertisers[request.reporter_id]
        const socials = socialsByUser[request.reporter_id] || []
        const requestedRole = request.subject?.includes('معلن')
          ? 'advertiser'
          : request.subject?.includes('صانع محتوى')
            ? 'creator'
            : null

        return (
          <section className="card" key={request.id}>
            <div className="row">
              <b>{request.subject || 'طلب تغيير نوع الحساب'}</b>
              <span className="badge">{request.status}</span>
            </div>

            <h3>بيانات صاحب الطلب</h3>
            <p><b>الاسم:</b> {user?.full_name || 'غير متوفر'}</p>
            <p><b>البريد الإلكتروني:</b> {user?.email || 'غير متوفر'}</p>
            <p><b>رقم الهاتف:</b> {user?.phone || 'غير متوفر'}</p>
            <p><b>حالة الحساب:</b> {user?.status || 'غير متوفر'}</p>

            <hr />
            <p><b>نوع الحساب الحالي:</b> {roleLabel(user?.role)}</p>
            <p><b>النوع المطلوب:</b> {requestedRole ? roleLabel(requestedRole) : 'غير واضح من عنوان الطلب'}</p>

            {creator && (
              <>
                <h3>ملف صانع المحتوى</h3>
                <p><b>الاسم الظاهر:</b> {creator.display_name || '—'}</p>
                <p><b>مجالات المحتوى:</b> {creator.niches?.join('، ') || '—'}</p>
                <p><b>الخبرة:</b> {creator.experience || '—'}</p>
              </>
            )}

            {advertiser && (
              <>
                <h3>ملف المعلن</h3>
                <p><b>اسم النشاط:</b> {advertiser.business_name || '—'}</p>
                <p><b>نوع النشاط:</b> {advertiser.business_type || '—'}</p>
                <p><b>الموقع الإلكتروني:</b> {advertiser.website || '—'}</p>
              </>
            )}

            <h3>الحسابات الاجتماعية</h3>
            {socials.length ? socials.map((account: any) => (
              <p key={account.id}>
                <b>{account.platform}:</b> {account.username}
                {account.profile_url && (
                  <> — <a href={account.profile_url} target="_blank" rel="noreferrer">فتح الحساب</a></>
                )}
              </p>
            )) : <p className="mu">لا توجد حسابات اجتماعية مسجلة.</p>}

            <hr />
            <h3>سبب الطلب</h3>
            <p>{request.details || 'لم يكتب المستخدم سببًا.'}</p>
            {request.admin_note && <p><b>ملاحظة الإدارة:</b> {request.admin_note}</p>}
            <p className="mu">
              تاريخ الطلب: {request.created_at ? new Date(request.created_at).toLocaleString('ar-EG') : '—'}
            </p>

            {request.status === 'open' && requestedRole && user && user.role !== requestedRole && (
              <RoleChangeActions id={request.id} />
            )}
            {request.status === 'open' && (!requestedRole || !user) && (
              <p className="mu">لا يمكن اتخاذ قرار قبل التأكد من بيانات المستخدم ونوع الحساب المطلوب.</p>
            )}
          </section>
        )
      })}
    </>
  )
}
