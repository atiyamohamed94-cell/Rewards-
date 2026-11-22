import Link from 'next/link'
import { sb, egp } from '@/lib/server'
import { Rpc } from '@/components/Actions'
import { NewCampaign, FundFull } from '@/components/CampClient'
import { SubmitReview } from '@/components/Actions'
import { Cover } from '@/components/Campaign'
const L: any = { draft: 'مسودة', pending: 'بانتظار الاعتماد', active: 'نشطة', paused: 'متوقفة', completed: 'مكتملة', rejected: 'مرفوضة', cancelled: 'ملغاة' }
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const [{ data: cs }, { data: tx }] = await Promise.all([s.from('campaigns').select('*').eq('advertiser_id', user!.id).order('created_at', { ascending: false }),
    s.from('wallet_transactions').select('reference_id,amount').eq('user_id', user!.id).eq('transaction_type', 'campaign_funding').lt('amount', 0)])
  const paid: any = {}; (tx || []).forEach((t: any) => { paid[t.reference_id] = (paid[t.reference_id] || 0) - Number(t.amount) })
  return <><h2>حملاتي</h2><NewCampaign uid={user!.id} />
    {!cs?.length && <div className="card mu">لم تنشئ حملات بعد. ابدأ بمسودة، ثم موّلها وأرسلها للاعتماد.</div>}
    {cs?.map((c: any) => { const rem = Math.max(0, Number(c.budget) - (paid[c.id] || 0)); const open = !['rejected', 'completed', 'cancelled'].includes(c.status)
      return <div className="card" key={c.id}><Link href={`/advertiser/campaigns/${c.id}`}><Cover c={c} h={110} /></Link><div className="row" style={{ marginTop: 8 }}><Link href={`/advertiser/campaigns/${c.id}`}><b>{c.title}</b></Link><span className="badge">{L[c.status]}</span></div>
        <p className="mu">الميزانية {egp(c.budget)} (عمولة 15% = {egp(c.budget * 0.15)} · للمبدعين {egp(c.budget * 0.85)})<br />المدفوع {egp(paid[c.id] || 0)} · المصروف للمبدعين {egp(c.spent_amount)}</p>
        {c.rejection_reason && <p style={{ color: '#ff7b9c' }}>سبب الرفض: {c.rejection_reason}</p>}
        <div className="row">{c.status === 'active' && <Rpc fn="set_campaign_status" args={{ p_id: c.id, p_status: 'paused' }} label="إيقاف مؤقت" ask="إيقاف الحملة مؤقتًا؟" />}{c.status === 'paused' && <Rpc fn="set_campaign_status" args={{ p_id: c.id, p_status: 'active' }} label="استئناف" />}
          {open && rem > 0 && <FundFull id={c.id} remaining={rem} />}{['draft', 'rejected'].includes(c.status) && paid[c.id] > 0 && <SubmitReview id={c.id} />}</div>
        {c.status === 'draft' && !(paid[c.id] > 0) && <p className="mu">موّل الحملة أولًا ليتمكن الأدمن من اعتمادها.</p>}</div> })}</>
}
