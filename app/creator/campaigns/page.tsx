import { sb, egp } from '@/lib/server'
import { Apply } from '@/components/Actions'
export default async function P() {
  const s = await sb()
  const { data: cs } = await s.from('campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false })
  const { data: mine } = await s.from('campaign_applications').select('campaign_id,status')
  const st: any = Object.fromEntries((mine || []).map((a: any) => [a.campaign_id, a.status]))
  const lbl: any = { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض', withdrawn: 'مسحوب' }
  return <><h2>الحملات المتاحة</h2>{!cs?.length && <div className="card mu">لا توجد حملات نشطة الآن. عُد قريبًا.</div>}
    <div className="grid">{cs?.map((c: any) => { const pct = c.funded_amount > 0 ? Math.min(100, Math.round(c.spent_amount / c.funded_amount * 100)) : 0
      return <div className="card" key={c.id}><div className="row"><b>{c.brand_name}</b><span className="badge">{c.compensation_type}</span></div><h3>{c.title}</h3>
        <p className="mu">{c.description?.slice(0, 120)}</p><p className="mu">{c.cpm_rate > 0 && `الألف مشاهدة: ${egp(c.cpm_rate)} · `}{c.fixed_reward > 0 && `ثابت: ${egp(c.fixed_reward)}`}</p>
        <div className="bar"><i style={{ width: pct + '%' }} /></div><p className="mu">تم صرف {pct}% من التمويل</p>
        {st[c.id] ? <span className="badge">طلبك: {lbl[st[c.id]]}</span> : <Apply id={c.id} />}</div> })}</div></>
}
