import { sb } from '@/lib/server'
import Pager from '@/components/Pager'
export const dynamic = 'force-dynamic'
export default async function P({ searchParams }: any) {
  const sp = await searchParams; const page = Math.max(1, +sp.page || 1); const PS = 25; const s = await sb()
  const { data, count } = await s.from('admin_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PS, page * PS - 1)
  return <><h2>سجل العمليات</h2>{!data?.length && <div className="card mu">لا توجد عمليات.</div>}
    {data?.map((l: any) => <div className="card" key={l.id}><div className="row"><b>{l.action}</b><span className="mu">{new Date(l.created_at).toLocaleString('ar-EG')}</span></div><p className="mu" dir="ltr" style={{ textAlign: 'start', wordBreak: 'break-all' }}>{l.target_type} {l.details ? JSON.stringify(l.details) : ''}</p></div>)}
    <Pager page={page} total={count} ps={PS} sp={sp} base="/admin/logs" /></>
}
