import { sb } from '@/lib/server'
import { Rpc } from '@/components/Actions'
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: cs } = await s.from('campaigns').select('id,title').eq('advertiser_id', user!.id)
  const blocks = await Promise.all((cs || []).map(async (c: any) => {
    const { data: ap } = await s.rpc('get_campaign_applicants', { p_campaign: c.id })
    const { data: subs } = await s.from('submissions').select('*').eq('campaign_id', c.id).order('submitted_at', { ascending: false })
    return { c, ap: ap || [], subs: subs || [] } }))
  return <><h2>الطلبات والتسليمات</h2>{!blocks.length && <div className="card mu">لا توجد حملات.</div>}
    {blocks.map(({ c, ap, subs }: any) => <div className="card" key={c.id}><h3>{c.title}</h3><b>المتقدمون</b>{!ap.length && <p className="mu">لا توجد طلبات.</p>}
      {ap.map((a: any) => <div className="row" key={a.application_id} style={{ padding: '8px 0', borderTop: '1px solid var(--ln)' }}>
        <span>{a.display_name || a.full_name || 'مبدع'}{a.verified ? ' ✓' : ''} <span className="badge">{a.status}</span><br /><span className="mu">{a.message}</span></span>
        {a.status === 'pending' && <span><Rpc fn="review_application" args={{ p_app: a.application_id, p_decision: 'accepted' }} label="قبول" /> <Rpc danger fn="review_application" args={{ p_app: a.application_id, p_decision: 'rejected' }} label="رفض" ask="رفض هذا الطلب؟" /></span>}</div>)}
      <b>التسليمات</b>{!subs.length && <p className="mu">لا توجد تسليمات.</p>}
      {subs.map((x: any) => <div className="row" key={x.id} style={{ padding: '8px 0', borderTop: '1px solid var(--ln)' }}>
        <span><a href={x.content_url} target="_blank" rel="noopener noreferrer">{x.content_url}</a> <span className="badge">{x.status}</span></span>
        {x.status === 'pending' && <span><Rpc fn="review_submission" args={{ p_sub: x.id, p_decision: 'approved', p_note: null }} label="قبول" /> <Rpc fn="review_submission" args={{ p_sub: x.id, p_decision: 'revision_requested', p_note: 'يرجى التعديل' }} label="طلب تعديل" /> <Rpc danger fn="review_submission" args={{ p_sub: x.id, p_decision: 'rejected', p_note: 'لا يطابق المتطلبات' }} label="رفض" ask="رفض هذا المحتوى؟" /></span>}</div>)}</div>)}</>
}
