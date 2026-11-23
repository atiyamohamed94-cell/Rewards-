import Link from 'next/link'
import { headers } from 'next/headers'
import { sb, egp } from '@/lib/server'
import { levelOf } from '@/lib/levels'
import { InviteBtn, CopyBtn } from './FeatClient'
export async function Kit({ id }: any) {
  const s = await sb(); const { data: k } = await s.rpc('get_creator_kit', { p_id: id })
  if (!k) return <div className="card mu">الملف غير متاح. قد يلزمك تسجيل الدخول، أو أن المبدع غير موجود.</div>
  const { data: vs } = await s.rpc('creator_verified_socials', { p_creator: id }); const okset = new Set((vs || []).map((x: any) => x.platform + x.username))
  const { l, n } = levelOf(Number(k.views)); const star = k.rating?.n > 0
  return <><div className="card" style={{ textAlign: 'center' }}>{k.avatar ? <img src={k.avatar} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} /> : <div className="avatar" style={{ width: 96, height: 96, margin: 'auto', fontSize: 40 }}>🎬</div>}
    <h2 style={{ marginBottom: 0 }}>{k.name}{k.verified ? ' ✓' : ''}</h2><p className="mu">{l.i} مستوى {l.ar}{star ? ` · ⭐ ${k.rating.avg} (${k.rating.n})` : ''}</p>
    <p>{(k.niches || []).map((x: string) => <span className="pill" key={x}>{x}</span>)}</p>{k.bio && <p>{k.bio}</p>}</div>
    <div className="grid"><div className="card"><div className="kpi g">{Number(k.views).toLocaleString('ar-EG')}</div><div className="mu">مشاهدات موثّقة</div></div><div className="card"><div className="kpi">{k.videos}</div><div className="mu">فيديو مقبول</div></div><div className="card"><div className="kpi">{k.campaigns}</div><div className="mu">حملة</div></div></div>
    {k.experience && <div className="card"><b>الخبرة</b><p>{k.experience}</p></div>}
    {!!k.socials?.length && <div className="card"><b>الحسابات</b><div className="row" style={{ justifyContent: 'flex-start', marginTop: 8 }}>{k.socials.map((a: any, i: number) => a.url ? <a key={i} className="btn o" href={a.url} target="_blank" rel="noopener noreferrer">{a.platform} · {a.username}{okset.has(a.platform + a.username) ? ' ✓' : ''}</a> : <span key={i} className="badge">{a.platform} · {a.username}{okset.has(a.platform + a.username) ? ' ✓' : ''}</span>)}</div></div>}
    {!!k.recent?.length && <div className="card"><b>آخر الحملات</b>{k.recent.map((r: any, i: number) => <p key={i} className="mu">{r.brand} — {r.title}</p>)}</div>}
    {!!k.reviews?.length && <div className="card"><b>آراء المعلنين</b>{k.reviews.map((r: any, i: number) => <p key={i}>{'⭐'.repeat(r.rating)} <span className="mu">{r.comment}</span></p>)}</div>}</>
}
export async function CreatorsDirectory({ sp }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const [{ data }, { data: cs }] = await Promise.all([s.rpc('search_creators', { p_niche: sp.niche || null, p_q: sp.q || null, p_limit: 20, p_offset: 0 }),
    s.from('campaigns').select('id,title').eq('advertiser_id', user!.id).eq('status', 'active')])
  return <><h2>🔎 تصفح المبدعين</h2><form className="card row"><input name="q" defaultValue={sp.q} placeholder="اسم المبدع" style={{ flex: 1 }} /><input name="niche" defaultValue={sp.niche} placeholder="المجال" style={{ width: 120 }} /><button className="btn">بحث</button></form>
    {!data?.length && <div className="card mu">لا يوجد مبدعون مطابقون.</div>}
    {data?.map((c: any) => { const lv = levelOf(Number(c.views)).l; return <div className="card" key={c.id}><div className="row"><Link href={`/kit/${c.id}`}><b>{c.name}{c.verified ? ' ✓' : ''}</b></Link><span className="badge">{lv.i} {lv.ar}</span></div>
      <p className="mu">{Number(c.views).toLocaleString('ar-EG')} مشاهدة · {c.videos} فيديو{c.rating_n > 0 ? ` · ⭐ ${c.rating} (${c.rating_n})` : ''}</p><p>{(c.niches || []).map((x: string) => <span className="pill" key={x}>{x}</span>)}</p>
      <InviteBtn creator={c.id} campaigns={cs || []} /></div> })}</>
}
export async function Referrals() {
  const s = await sb(); const h = await headers(); const host = h.get('host')
  const [{ data: code }, { data: list }] = await Promise.all([s.rpc('my_referral_code'), s.rpc('my_referrals')])
  const link = `https://${host}/register?ref=${code}`
  return <><h2>🎁 دعوة الأصدقاء</h2><div className="card"><p className="mu">نظام تجريبي: نسجّل من انضم عبر رابطك الآن، وستُفعَّل المكافآت لاحقًا عند إطلاق الموقع على دومين رسمي. لا توجد مكافآت مالية حاليًا.</p>
    <p dir="ltr" style={{ wordBreak: 'break-all' }}>{link}</p><CopyBtn text={link} /></div>
    <div className="card"><div className="kpi g">{list?.length || 0}</div><div className="mu">انضموا عبر رابطك</div></div>
    {list?.map((r: any, i: number) => <div className="card row" key={i}><span>{r.name} <span className="badge">{r.role === 'advertiser' ? 'معلن' : 'مبدع'}</span></span><span className="mu">{new Date(r.joined_at).toLocaleDateString('ar-EG')}</span></div>)}</>
}
