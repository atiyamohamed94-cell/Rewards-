import type { Metadata } from 'next'
import Link from 'next/link'
import Public from '@/components/Public'
import AvatarImg from '@/components/AvatarImg'
import { Cover, reward } from '@/components/Campaign'
import { sb } from '@/lib/server'
export const dynamic = 'force-dynamic'
async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const s = await sb(); const { data } = await s.rpc('public_advertiser', { p_id: id })
  return (data || null) as any
}
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const b = await load((await params).id)
  if (!b) return { title: 'الصفحة غير متاحة' }
  const description = String(b.bio || '').slice(0, 140)
  return { title: `${b.name} على Content Hub`, description, openGraph: { title: b.name, description, type: 'website', images: b.avatar ? [b.avatar] : [] } }
}
export default async function P({ params }: any) {
  const id = (await params).id; const b = await load(id)
  if (!b) return <Public><div className="card"><p>هذه الصفحة غير متاحة.</p><Link className="btn" href="/">الصفحة الرئيسية</Link></div></Public>
  const s = await sb(); const session = (await s.auth.getSession()).data.session
  const { data: rep } = await s.rpc('reputation', { p_user: id }); const r0 = Array.isArray(rep) ? rep[0] : null
  const web = typeof b.website === 'string' && /^https?:\/\//i.test(b.website) ? b.website : ''
  return <Public>
    <div className="card" style={{ textAlign: 'center' }}><div style={{ display: 'flex', justifyContent: 'center' }}><AvatarImg src={b.avatar} size={96} emoji="🏢" /></div>
      <h2 style={{ marginBottom: 0 }}>{b.name}{b.verified ? ' ✓' : ''}</h2>
      <p className="mu">{b.type}{r0?.n > 0 && ` · ⭐ ${r0.avg_rating} (${r0.n})`}</p>
      {b.bio && <p>{b.bio}</p>}
      {web && <p><a href={web} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{web}</a></p>}
      {b.verified && <p className="mu">✓ تم التحقق من هوية هذا النشاط من إدارة المنصة.</p>}</div>
    <div className="grid">
      <div className="card"><div className="kpi">{b.campaigns}</div><div className="mu">حملة</div></div>
      <div className="card"><div className="kpi g">{b.completed}</div><div className="mu">حملة مكتملة</div></div>
      <div className="card"><div className="kpi">{b.creators}</div><div className="mu">مبدع عملوا معه</div></div></div>
    <p className="mu">عضو منذ {new Date(b.joined).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}</p>
    <h3>الحملات المتاحة الآن</h3>
    {!b.active?.length && <div className="card mu">لا توجد حملات نشطة حاليًا.</div>}
    {b.active?.map((c: any) => <Link key={c.id} href={`/c/${c.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}><div className="card"><Cover c={c} h={110} /><b style={{ display: 'block', marginTop: 8 }}>{c.title}</b>{reward(c) && <p className="mu" style={{ margin: 0 }}>{reward(c)}</p>}</div></Link>)}
    {!session && <Link className="btn" style={{ width: '100%' }} href="/register">سجّل كصانع محتوى وانضم لحملاتهم</Link>}
  </Public>
}
