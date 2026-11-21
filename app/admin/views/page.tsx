import { sb } from '@/lib/server'
import { ViewForm } from '@/components/Actions'
export default async function P() {
  const s = await sb(); const { data: subs } = await s.from('submissions').select('id,content_url').eq('status', 'approved')
  const { data: vs } = await s.from('view_snapshots').select('*').order('captured_at', { ascending: false }).limit(20)
  return <><h2>المشاهدات الموثّقة</h2><ViewForm subs={subs || []} /><h3>آخر اللقطات</h3>{!vs?.length && <p className="mu">لا توجد لقطات.</p>}
    {vs?.map((v: any) => <div className="card row" key={v.id}><span>{Number(v.views).toLocaleString('ar-EG')} مشاهدة</span><span className="badge">{v.verified ? 'موثّق' : 'غير موثّق'}</span></div>)}</>
}
