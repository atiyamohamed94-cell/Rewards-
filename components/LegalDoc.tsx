import Public from '@/components/Public'
import type { LegalDocData } from '@/lib/legal'
export default function LegalDoc({ d }: { d: LegalDocData }) {
  return <Public><h1>{d.title}</h1>
    <p className="mu">آخر تحديث: {d.version}{d.draft ? ' · نسخة مبدئية، يجب مراجعتها قانونيًا قبل الإطلاق.' : ''}</p>
    {d.sections.map(s => <div className="card" key={s.title}><h3>{s.title}</h3>{s.body.map((p, i) => <p key={i}>{p}</p>)}</div>)}
  </Public>
}
