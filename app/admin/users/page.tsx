import { sb } from '@/lib/server'
import { StatusBtn } from '@/components/Actions'
export default async function P({ searchParams }: any) {
  const q = ((await searchParams)?.q || '').trim(); const s = await sb()
  let qb = s.from('profiles').select('id,full_name,email,role,status,created_at').order('created_at', { ascending: false }).limit(50)
  if (q) qb = qb.or(`email.ilike.%${q.replace(/[%,()]/g, '')}%,full_name.ilike.%${q.replace(/[%,()]/g, '')}%`)
  const { data } = await qb
  return <><h2>المستخدمون</h2><form><input name="q" defaultValue={q} placeholder="بحث بالاسم أو البريد" /></form>{!data?.length && <div className="card mu">لا نتائج.</div>}
    {data?.map((u: any) => <div className="card row" key={u.id}><span><b>{u.full_name || '—'}</b> <span className="badge">{u.role}</span> <span className="badge">{u.status}</span><br /><span className="mu">{u.email}</span></span>
      {u.role !== 'admin' && <StatusBtn id={u.id} to={u.status === 'active' ? 'suspended' : 'active'} />}</div>)}</>
}
