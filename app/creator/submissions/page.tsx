import { sb, egp } from '@/lib/server'
import { SubmitContent, Rpc } from '@/components/Actions'
const L: any = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض', revision_requested: 'مطلوب تعديل' }
export default async function P() {
  const s = await sb(); const { data: { user } } = await s.auth.getUser()
  const { data: apps } = await s.from('campaign_applications').select('id,campaign_id,creator_id,campaigns(title)').eq('creator_id', user!.id).eq('status', 'accepted')
  const { data: subs } = await s.from('submissions').select('*,campaigns(title)').eq('creator_id', user!.id).order('submitted_at', { ascending: false })
  return <><h2>تسليماتي</h2><SubmitContent apps={apps || []} />
    {!subs?.length && <div className="card mu">لم ترسل أي محتوى بعد.</div>}
    {subs?.map((x: any) => <div className="card" key={x.id}><div className="row"><b>{x.campaigns?.title}</b><span className="badge">{L[x.status]}</span></div>
      <a className="mu" href={x.content_url} target="_blank" rel="noopener noreferrer">{x.content_url}</a><p className="mu">المشاهدات المحتسبة: {Number(x.paid_views).toLocaleString('ar-EG')}{x.fixed_paid ? ' · تم صرف المكافأة الثابتة' : ''}</p>
      {x.review_note && <p>ملاحظة المراجع: {x.review_note}</p>}</div>)}</>
}
