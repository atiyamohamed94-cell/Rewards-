import type { Metadata } from 'next'
import Link from 'next/link'
import Public from '@/components/Public'
import { Cover, reward } from '@/components/Campaign'
import { sb } from '@/lib/server'
export const dynamic = 'force-dynamic'
async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const s = await sb(); const { data } = await s.rpc('public_campaign', { p_id: id })
  return (data || null) as any
}
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const c = await load((await params).id)
  if (!c) return { title: 'الحملة غير متاحة' }
  const title = `${c.brand_name} — ${c.title}`, description = String(c.description || '').slice(0, 140)
  return { title, description, openGraph: { title, description, type: 'website', images: c.image_url ? [c.image_url] : [] } }
}
export default async function P({ params, searchParams }: any) {
  const id = (await params).id; const sp = await searchParams; const c = await load(id)
  const ref = typeof sp?.ref === 'string' && /^[A-Za-z0-9]{8}$/.test(sp.ref) ? sp.ref : ''
  const s = await sb(); const session = (await s.auth.getSession()).data.session
  if (!c) return <Public><div className="card"><p>هذه الحملة غير متاحة حاليًا.</p><Link className="btn" href="/">الصفحة الرئيسية</Link></div></Public>
  const pl = Array.isArray(c.platforms) ? c.platforms.join(' · ') : ''
  return <Public>
    <Cover c={c} h={200} />
    <h2 style={{ marginTop: 12 }}>{c.title}</h2><p className="mu">{c.brand_name}{pl && ` · ${pl}`}</p>
    <div className="card"><p style={{ whiteSpace: 'pre-wrap' }}>{c.description}</p></div>
    <div className="card">{reward(c) && <p><span className="mu">المكافأة: </span>{reward(c)}</p>}
      {c.creators_needed > 0 && <p><span className="mu">عدد المبدعين المطلوب: </span>{c.creators_needed}</p>}
      {typeof c.application_requirements === 'string' && c.application_requirements && <p><span className="mu">شروط التقديم: </span>{c.application_requirements}</p>}</div>
    {session ? <Link className="btn" style={{ width: '100%' }} href="/go">ادخل لحسابك للتقديم</Link>
      : <><Link className="btn" style={{ width: '100%' }} href={`/register${ref ? `?ref=${ref}` : ''}`}>سجّل كصانع محتوى وانضم للحملة</Link>
        <p className="mu" style={{ textAlign: 'center' }}>عندك حساب؟ <Link href="/login">سجّل الدخول</Link></p></>}
  </Public>
}
