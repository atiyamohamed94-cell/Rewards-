export default function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map(d => d[1]))
  return <div className="card"><b>{title}</b>{!data.length ? <p className="mu">لا توجد بيانات بعد.</p> :
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, marginTop: 10 }}>{data.map(([k, v]) => <div key={k} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
      <div title={String(v)} style={{ height: (v / max) * 100, background: 'linear-gradient(var(--m),var(--p))', borderRadius: '6px 6px 0 0' }} /><span className="mu">{k.slice(5)}</span></div>)}</div>}</div>
}
