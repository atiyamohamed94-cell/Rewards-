import { sb } from '@/lib/server'
import { FaqForm, Del } from '@/components/Actions'
export default async function P() { const s = await sb(); const { data } = await s.from('faqs').select('*').order('sort_order')
  return <><h2>الأسئلة الشائعة</h2><FaqForm />{data?.map((f: any) => <div className="card row" key={f.id}><span>{f.question}</span><Del table="faqs" id={f.id} /></div>)}</> }
