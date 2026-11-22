import { sb, egp } from '@/lib/server'
import { Apply } from '@/components/Actions'
import Pager from '@/components/Pager'
export const dynamic = 'force-dynamic'
export default async function P({ searchParams }: any) {
  const sp = await searchParams; const page = Math.max(1, +sp.page || 1); const PS = 9; const s = await sb()
  let q = s.from('campaigns').select('*', { count: 'exact' }).eq('status', 'active')
  if (sp.q) q = q.ilike('title', `%${String(sp.q).replace(/[%,()]/g, '')}%`)
  if (sp.type) q = q.eq('campaign_type', sp.type); if (sp.comp) q = q.eq('compensation_type', sp.comp); if (sp.pl) q = q.contains('platforms', [sp.pl])
  q = sp.sort === 'cpm' ? q.order('cpm_rate', { ascending: false }) : q.order('created_at', { ascending: false })
  const { data: cs, count } = await q.range((page - 1) * PS, page * PS - 1)
  const { data: mine } = await s.from('campaign_applications').select('campaign_id,status')
  const st: any = Object.fromEntries((mine || []).map((a: any) => [a.campaign_id, a.status]))
  const lbl: any = { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض', withdrawn: 'مسحوب' }
  return <><h2>الحملات المتاحة</h2>
    <form className="card"><input name="q" defaultValue={sp.q} placeholder="ابحث عن حملة..." />
      <div className="grid"><select name="type" defaultValue={sp.type || ''}><option value="">كل الأنواع</option>{['clipping', 'ugc', 'influencer', 'posting'].map(x => <option key={x}>{x}</option>)}</select>
        <select name="comp" defaultValue={sp.comp || ''}><option value="">كل المكافآت</option>{['fixed', 'cpm', 'hybrid'].map(x => <option key={x}>{x}</option>)}</select>
        <select name="pl" defaultValue={sp.pl || ''}><option value="">كل المنصات</option>{['tiktok', 'instagram', 'youtube'].map(x => <option key={x}>{x}</option>)}</select>
        <select name="sort" defaultValue={sp.sort || ''}><option value="">الأحدث</option><option value="cpm">الأعلى سعرًا للألف</option></select></div>
      <button className="btn">تطبيق</button></form>
    {!cs?.length && <div className="card mu">لا توجد حملات مطابقة.</div>}
    <div className="grid">{cs?.map((c: any) => { const pct = c.funded_amount > 0 ? Math.min(100, Math.round(c.spent_amount / c.funded_amount * 100)) : 0
      return <div className="card" key={c.id}><div className="row"><b>{c.brand_name}</b><span className="badge">{c.compensation_type}</span></div><h3>{c.title}</h3>
        <p className="mu">{c.description?.slice(0, 120)}</p><p className="mu">{c.cpm_rate > 0 && `الألف مشاهدة: ${egp(c.cpm_rate)} · `}{c.fixed_reward > 0 && `ثابت: ${egp(c.fixed_reward)}`}</p>
        <div className="bar"><i style={{ width: pct + '%' }} /></div><p className="mu">تم صرف {pct}% من التمويل</p>
        {st[c.id] ? <span className="badge">طلبك: {lbl[st[c.id]]}</span> : <Apply id={c.id} />}</div> })}</div>
    <Pager page={page} total={count} ps={PS} sp={sp} base="/creator/campaigns" /></>
}
