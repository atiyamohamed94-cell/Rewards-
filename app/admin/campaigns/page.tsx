import Link from 'next/link'
import { sb, egp } from '@/lib/server'
import { CampStatus } from '@/components/Forms'
import Pager from '@/components/Pager'
export const dynamic = 'force-dynamic'
export default async function P({ searchParams }: any) {
  const sp = await searchParams; const page = Math.max(1, +sp.page || 1); const PS = 15; const s = await sb()
  let q = s.from('campaigns').select('*', { count: 'exact' }).order('created_at', { ascending: false }); if (sp.s) q = q.eq('status', sp.s)
  const { data, count } = await q.range((page - 1) * PS, page * PS - 1)
  return <><h2>كل الحملات</h2><div className="row">{['', 'draft', 'pending', 'active', 'paused', 'completed', 'rejected'].map(x => <Link key={x} className="btn o s" href={x ? '?s=' + x : '?'}>{x || 'الكل'}</Link>)}</div><br />
    {!data?.length && <div className="card mu">لا توجد حملات.</div>}
    {data?.map((c: any) => <div className="card" key={c.id}><div className="row"><b>{c.title}</b><span className="badge">{c.status}</span></div><p className="mu">{c.brand_name} · الميزانية {egp(c.budget)} · الممول {egp(c.funded_amount)} · المصروف {egp(c.spent_amount)}</p>
      <div className="row">{c.status === 'active' && <CampStatus id={c.id} to="paused" label="إيقاف مؤقت" />}{c.status === 'paused' && <CampStatus id={c.id} to="active" label="استئناف" />}</div></div>)}
    <Pager page={page} total={count} ps={PS} sp={sp} base="/admin/campaigns" /></>
}
