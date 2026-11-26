import { sb } from '@/lib/server'
import Link from 'next/link'
import AvatarImg from '@/components/AvatarImg'
import { StatusBtn } from '@/components/Actions'
import { VerifyBtn } from '@/components/Forms'
import Pager from '@/components/Pager'
export const dynamic = 'force-dynamic'
export default async function P({ searchParams }: any) {
  const sp = await searchParams; const q = String(sp.q || '').trim().replace(/[%,()]/g, ''); const page = Math.max(1, +sp.page || 1); const PS = 20; const s = await sb()
  let qb = s.from('profiles').select('id,full_name,email,role,status,created_at,avatar_url,phone', { count: 'exact' }).order('created_at', { ascending: false })
  if (q) qb = qb.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`); if (sp.role) qb = qb.eq('role', sp.role)
  const { data, count } = await qb.range((page - 1) * PS, page * PS - 1)
  const ids = (data || []).map((u: any) => u.id)
  const [c, a] = await Promise.all([s.from('creator_profiles').select('user_id,verified').in('user_id', ids), s.from('advertiser_profiles').select('user_id,verified').in('user_id', ids)])
  const wa = (p: any) => { const d = String(p || '').replace(/\D/g, ''); return /^01\d{9}$/.test(d) ? 'https://wa.me/20' + d.slice(1) : '' }
  const ver: any = {}; [...(c.data || []), ...(a.data || [])].forEach((x: any) => { ver[x.user_id] = x.verified })
  return <><h2>المستخدمون</h2><form className="row"><input name="q" defaultValue={q} placeholder="بحث بالاسم أو البريد" style={{ flex: 1 }} /><select name="role" defaultValue={sp.role || ''} style={{ width: 120 }}><option value="">الكل</option><option value="creator">مبدعون</option><option value="advertiser">معلنون</option></select><button className="btn">بحث</button></form>
    {!data?.length && <div className="card mu">لا نتائج.</div>}
    {data?.map((u: any) => <div className="card" key={u.id}><div className="row"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><AvatarImg src={u.avatar_url} size={40} /><span><b>{u.full_name || '—'}</b>{ver[u.id] ? ' ✓' : ''} <span className="badge">{u.role}</span> <span className="badge">{u.status}</span><br /><span className="mu">{u.email}{u.phone ? ' · ' + u.phone : ''}</span></span></span></div>
      {u.role !== 'admin' && <div className="row" style={{ marginTop: 8 }}><VerifyBtn id={u.id} role={u.role} on={!!ver[u.id]} />{u.role === 'creator' && <Link className="btn o" href={`/kit/${u.id}`}>الملف العام</Link>}{u.role === 'advertiser' && <Link className="btn o" href={`/brand/${u.id}`}>الملف العام</Link>}{u.phone && <a className="btn o" href={'tel:' + String(u.phone).replace(/\D/g, '')}>اتصال</a>}{wa(u.phone) && <a className="btn" href={wa(u.phone)} target="_blank" rel="noopener noreferrer">واتساب</a>}<StatusBtn id={u.id} to={u.status === 'active' ? 'suspended' : 'active'} /></div>}</div>)}
    <Pager page={page} total={count} ps={PS} sp={sp} base="/admin/users" /></>
}
