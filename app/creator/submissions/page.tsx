import { sb, egp } from '@/lib/server'
import { SubmitContent, Rpc } from '@/components/Actions'
import { ClaimForm } from '@/components/Forms'
const L: any = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض', revision_requested: 'مطلوب تعديل' }
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: apps } = await s.from('campaign_applications').select('id,campaign_id,creator_id,campaigns(title)').eq('creator_id', user!.id).eq('status', 'accepted')
  const { data: subs } = await s.from('submissions').select('*,campaigns(title)').eq('creator_id', user!.id).order('submitted_at', { ascending: false })
  const { data: claims } = await s.from('view_claims').select('*').eq('creator_id', user!.id).order('created_at', { ascending: false })
  const cl: any = {}; (claims || []).forEach((c: any) => { (cl[c.submission_id] ||= []).push(c) })
  const CL: any = { pending: 'بانتظار المراجعة', approved: 'تم الاعتماد', rejected: 'مرفوض' }
  return <><h2>تسليماتي</h2><SubmitContent apps={apps || []} />
    {!subs?.length && <div className="card mu">لم ترسل أي محتوى بعد.</div>}
    {subs?.map((x: any) => <div className="card" key={x.id}><div className="row"><b>{x.campaigns?.title}</b><span className="badge">{L[x.status]}</span></div>
      <a className="mu" href={x.content_url} target="_blank" rel="noopener noreferrer">{x.content_url}</a><p className="mu">المشاهدات المحتسبة: {Number(x.paid_views).toLocaleString('ar-EG')}{x.fixed_paid ? ' · تم صرف المكافأة الثابتة' : ''}</p>
      {x.review_note && <p>ملاحظة المراجع: {x.review_note}</p>}
      {(cl[x.id] || []).map((c: any) => <p className="mu" key={c.id}>طلب مشاهدات: {Number(c.claimed_views).toLocaleString('ar-EG')} · <b>{CL[c.status]}</b>{c.admin_note ? ' · ' + c.admin_note : ''}</p>)}
      {x.status === 'approved' && !(cl[x.id] || []).some((c: any) => c.status === 'pending') && <ClaimForm sid={x.id} uid={user!.id} />}</div>)}</>
}
