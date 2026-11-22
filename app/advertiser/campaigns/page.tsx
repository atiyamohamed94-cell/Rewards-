import { sb, egp } from '@/lib/server'
import { CampaignForm, Fund, SubmitReview, Rpc } from '@/components/Actions'
const L: any = { draft: 'مسودة', pending: 'بانتظار الاعتماد', active: 'نشطة', paused: 'متوقفة', completed: 'مكتملة', rejected: 'مرفوضة', cancelled: 'ملغاة' }
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: cs } = await s.from('campaigns').select('*').eq('advertiser_id', user!.id).order('created_at', { ascending: false })
  return <><h2>حملاتي</h2><CampaignForm uid={user!.id} />
    {!cs?.length && <div className="card mu">لم تنشئ حملات بعد. ابدأ بمسودة، ثم موّلها وأرسلها للاعتماد.</div>}
    {cs?.map((c: any) => <div className="card" key={c.id}><div className="row"><b>{c.title}</b><span className="badge">{L[c.status]}</span></div>
      <p className="mu">الميزانية {egp(c.budget)} · الممول {egp(c.funded_amount)} · المصروف {egp(c.spent_amount)}</p>
      {c.rejection_reason && <p style={{ color: '#ff7b9c' }}>سبب الرفض: {c.rejection_reason}</p>}
      <div className="row">{c.status === 'active' && <Rpc fn="set_campaign_status" args={{ p_id: c.id, p_status: 'paused' }} label="إيقاف مؤقت" ask="إيقاف الحملة مؤقتًا؟" />}{c.status === 'paused' && <Rpc fn="set_campaign_status" args={{ p_id: c.id, p_status: 'active' }} label="استئناف" />}{!['rejected', 'completed', 'cancelled'].includes(c.status) && <Fund id={c.id} />}{['draft', 'rejected'].includes(c.status) && c.funded_amount > 0 && <SubmitReview id={c.id} />}</div>
      {c.status === 'draft' && c.funded_amount <= 0 && <p className="mu">موّل الحملة أولًا ليتمكن الأدمن من اعتمادها.</p>}</div>)}</>
}
