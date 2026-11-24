
import { sb } from '@/lib/server'
import { ResolveBtn } from '@/components/Forms'

export default async function P() {
  const s = await sb()

  const { data: requests, error } = await s
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="card">تعذر تحميل الطلبات: {error.message}</div>
  }

  const ids = [...new Set(
    (requests || [])
      .map((r: any) => r.reporter_id)
      .filter(Boolean)
  )]

  const [profiles, creators, advertisers, socials] = ids.length
    ? await Promise.all([
        s.from('profiles')
          .select('id,full_name,email,phone,role,status,avatar_url')
          .in('id', ids),
        s.from('creator_profiles')
          .select('*')
          .in('user_id', ids),
        s.from('advertiser_profiles')
          .select('*')
          .in('user_id', ids),
        s.from('social_accounts')
          .select('*')
          .in('user_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const profileMap = Object.fromEntries(
    (profiles.data || []).map((p: any) => [p.id, p])
  )
  const creatorMap = Object.fromEntries(
    (creators.data || []).map((p: any) => [p.user_id, p])
  )
  const advertiserMap = Object.fromEntries(
    (advertisers.data || []).map((p: any) => [p.user_id, p])
  )
  const socialMap: Record<string, any[]> = {}

  for (const social of socials.data || []) {
    socialMap[social.user_id] ||= []
    socialMap[social.user_id].push(social)
  }

  const roleName = (role: string) =>
    role === 'creator' ? 'صانع محتوى'
    : role === 'advertiser' ? 'معلن'
    : role || 'غير معروف'

  return (
    <>
      <h2>طلبات تغيير نوع الحساب</h2>
      <p className="mu">
        مراجعة طلبات التحويل بين صانع محتوى ومعلن.
      </p>

      {!requests?.length && (
        <div className="card mu">لا توجد طلبات حاليًا.</div>
      )}

      {requests?.map((d: any) => {
        const p = profileMap[d.reporter_id]
        const creator = creatorMap[d.reporter_id]
        const advertiser = advertiserMap[d.reporter_id]
        const socialsForUser = socialMap[d.reporter_id] || []

        const requestedRole =
          d.subject?.includes('معلن') ? 'advertiser'
          : d.subject?.includes('صانع محتوى') ? 'creator'
          : null

        return (
          <div className="card" key={d.id}>
            <div className="row">
              <b>طلب تغيير نوع الحساب</b>
              <span className="badge">{d.status}</span>
            </div>

            <h3>بيانات صاحب الطلب</h3>
            <p><b>الاسم:</b> {p?.full_name || 'غير متوفر'}</p>
            <p><b>البريد:</b> {p?.email || 'غير متوفر'}</p>
            <p><b>الهاتف:</b> {p?.phone || 'غير متوفر'}</p>
            <p><b>حالة الحساب:</b> {p?.status || 'غير متوفر'}</p>

            <hr />

            <p>
              <b>نوع الحساب الحالي:</b>{' '}
              {roleName(p?.role)}
            </p>
            <p>
              <b>النوع المطلوب:</b>{' '}
              {requestedRole ? roleName(requestedRole) : 'راجع نص الطلب'}
            </p>

            {creator && (
              <>
                <h3>ملف صانع المحتوى</h3>
                <p><b>الاسم الظاهر:</b> {creator.display_name || '—'}</p>
                <p><b>المجالات:</b> {creator.niches?.join('، ') || '—'}</p>
              </>
            )}

            {advertiser && (
              <>
                <h3>ملف المعلن</h3>
                <p><b>اسم النشاط:</b> {advertiser.business_name || '—'}</p>
                <p><b>نوع النشاط:</b> {advertiser.business_type || '—'}</p>
                <p><b>الموقع:</b> {advertiser.website || '—'}</p>
              </>
            )}

            <h3>الحسابات الاجتماعية</h3>
            {socialsForUser.length ? (
              socialsForUser.map((a: any) => (
                <p key={a.id}>
                  {a.platform}: {a.username || '—'}{' '}
                  {a.profile_url && (
                    <a href={a.profile_url} target="_blank" rel="noreferrer">
                      فتح الحساب
                    </a>
                  )}
                </p>
              ))
            ) : (
              <p className="mu">لا توجد حسابات اجتماعية مسجلة.</p>
            )}

            <hr />

            <h3>سبب الطلب</h3>
            <p>{d.details || 'لم يكتب المستخدم سببًا.'}</p>
            <p className="mu">
              تاريخ الطلب:{' '}
              {d.created_at
                ? new Date(d.created_at).toLocaleString('ar-EG')
                : '—'}
            </p>

            {d.status !== 'resolved' && (
              <p className="mu">
                لم نفعّل زر المعالجة هنا حتى نضيف إجراء قبول آمن يغيّر
                نوع الحساب فعليًا، بدل إغلاق الطلب فقط.
              </p>
            )}
          </div>
        )
      })}
    </>
  )
}
