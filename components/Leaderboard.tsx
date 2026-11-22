import Link from 'next/link'
import { sb } from '@/lib/server'
import { levelOf } from '@/lib/levels'
export async function Leaderboard({ role, sp }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user; const per = sp?.p === 'month' ? 'month' : 'all'
  const { data } = await s.rpc('get_leaderboard', { p_period: per, p_limit: 20 })
  let mine: any = null
  if (role === 'creator') { const { data: m } = await s.from('submissions').select('paid_views').eq('creator_id', user!.id).eq('status', 'approved'); const tot = (m || []).reduce((a: number, x: any) => a + Number(x.paid_views), 0); mine = { tot, ...levelOf(tot) } }
  const base = `/${role}/leaderboard`
  return <><h2>🏆 المتصدرون</h2><div className="row" style={{ marginBottom: 10 }}><Link className={'btn ' + (per === 'all' ? '' : 'o')} href={base}>كل الوقت</Link><Link className={'btn ' + (per === 'month' ? '' : 'o')} href={base + '?p=month'}>هذا الشهر</Link></div>
    {mine && <div className="card"><div className="row"><b>مستواك: {mine.l.i} {mine.l.ar}</b><span className="mu">{mine.tot.toLocaleString('ar-EG')} مشاهدة</span></div>
      {mine.n ? <><div className="bar" style={{ margin: '8px 0' }}><i style={{ width: Math.min(100, (mine.tot - mine.l.min) / (mine.n.min - mine.l.min) * 100) + '%' }} /></div><p className="mu">متبقي {(mine.n.min - mine.tot).toLocaleString('ar-EG')} مشاهدة للوصول إلى {mine.n.i} {mine.n.ar}</p></> : <p className="mu">وصلت لأعلى مستوى 👑</p>}</div>}
    {!data?.length && <div className="card mu">لا توجد بيانات بعد. تظهر الأسماء بعد قبول التسليمات وتوثيق المشاهدات.</div>}
    {data?.map((r: any) => { const lv = levelOf(Number(r.total_views)).l; return <div className="card row" key={r.creator_id} style={r.creator_id === user!.id ? { borderColor: 'var(--p)' } : {}}>
      <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="avatar" style={{ fontSize: 16 }}>{['🥇', '🥈', '🥉'][r.pos - 1] || r.pos}</span><span><b>{r.display_name}{r.verified ? ' ✓' : ''}</b><br /><span className="mu">{lv.i} {lv.ar} · {r.approved_videos} فيديو</span></span></span>
      <b>{Number(r.total_views).toLocaleString('ar-EG')}</b></div> })}</>
}
