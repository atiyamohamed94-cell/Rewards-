import Public from '@/components/Public'
import { sb } from '@/lib/server'
export const dynamic = 'force-dynamic'
export default async function P() { const s = await sb(); const { data } = await s.from('faqs').select('*').eq('is_published', true).order('sort_order')
  return <Public><h1>الأسئلة الشائعة</h1>{!data?.length && <div className="card mu">لا توجد أسئلة منشورة بعد.</div>}
    {data?.map((f: any) => <details className="card" key={f.id}><summary><b>{f.question}</b></summary><p className="mu">{f.answer}</p></details>)}</Public> }
