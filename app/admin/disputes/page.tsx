import { sb } from '@/lib/server'
import { ResolveBtn } from '@/components/Forms'
export default async function P() { const s = await sb(); const { data } = await s.from('disputes').select('*').order('created_at', { ascending: false }).limit(50)
  return <><h2>الطلبات والنزاعات</h2><p className="mu">تغيير نوع الحساب يتم يدويًا من SQL Editor بعد التأكد أن الرصيد صفر ولا توجد حملات نشطة.</p>
    {!data?.length && <div className="card mu">لا توجد طلبات.</div>}{data?.map((d: any) => <div className="card" key={d.id}><div className="row"><b>{d.subject}</b><span className="badge">{d.status}</span></div><p className="mu">{d.details}</p>{d.status !== 'resolved' && <ResolveBtn id={d.id} />}</div>)}</> }
