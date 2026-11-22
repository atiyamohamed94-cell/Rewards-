import { sb } from '@/lib/server'
import { ClaimReview } from './Claims'
const AD: any = { approved: 'وافق المعلن', rejected: 'رفض المعلن', disputed: 'المعلن صعّد للإدارة' }
const ST: any = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
export default async function ClaimsList({ role, scope }: any) {
  const s = await sb(); const { data } = await s.rpc('list_view_claims', { p_scope: scope, p_status: role === 'admin' ? 'pending' : null })
  const rows = data || []
  const urls: any = {}; for (const r of rows) { const { data: u } = await s.storage.from('view-proofs').createSignedUrl(r.proof_path, 300); urls[r.id] = u?.signedUrl }
  if (!rows.length) return <div className="card mu">لا توجد طلبات.</div>
  return <>{rows.map((r: any) => <div className="card" key={r.id}>
    <div className="row"><b>{r.campaign_title}</b><span className="badge">{ST[r.status]}</span></div>
    <p className="mu">المبدع: {r.creator_name}</p><p>المطلوب اعتماده: <b>{Number(r.claimed_views).toLocaleString('ar-EG')}</b> مشاهدة · الموثّق سابقًا: {Number(r.last_verified).toLocaleString('ar-EG')}</p>
    <p><a href={r.content_url} target="_blank" rel="noopener noreferrer">فتح الفيديو</a>{urls[r.id] && <> · <a href={urls[r.id]} target="_blank" rel="noopener noreferrer">عرض لقطة الإحصائيات</a></>}</p>
    {r.note && <p className="mu">ملاحظة المبدع: {r.note}</p>}{r.adv_decision && <p><span className="badge">{AD[r.adv_decision]}</span> {r.adv_note}</p>}{r.admin_note && <p className="mu">رد الإدارة: {r.admin_note}</p>}
    {r.status === 'pending' && role === 'advertiser' && !r.adv_decision && <ClaimReview id={r.id} mode="advertiser" />}
    {r.status === 'pending' && role === 'admin' && <ClaimReview id={r.id} mode="admin" />}</div>)}</>
}
