import { sb } from '@/lib/server'
import { Rpc } from '@/components/Actions'
export const dynamic = 'force-dynamic'
export default async function P() { const s = await sb(); const { data } = await s.rpc('admin_pending_socials')
  return <><h2>توثيق حسابات السوشيال</h2><p className="mu">افتح رابط الحساب وتأكد أن الكود ظاهر في الوصف (Bio) ثم وثّق. الكود يطابق ما أعطيته للمستخدم.</p>
    {!data?.length && <div className="card mu">لا توجد طلبات.</div>}
    {data?.map((r: any) => <div className="card" key={r.account_id}><b>{r.user_name}</b> · {r.platform} · @{r.username}<p className="mu">الكود المطلوب: <b dir="ltr" style={{ userSelect: 'all' }}>{r.code}</b></p>
      <div className="row">{r.profile_url && <a className="btn o" href={r.profile_url} target="_blank" rel="noopener noreferrer">فتح الحساب</a>}
        <Rpc fn="admin_review_social" args={{ p_account: r.account_id, p_decision: 'verified', p_note: null }} label="توثيق ✓" ask="هل رأيت الكود في وصف الحساب؟" />
        <Rpc danger fn="admin_review_social" args={{ p_account: r.account_id, p_decision: 'rejected', p_note: 'لم يظهر الكود في وصف الحساب' }} label="رفض" ask="رفض الطلب؟" /></div></div>)}</> }
