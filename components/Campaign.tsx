import Link from 'next/link'
import { sb, egp } from '@/lib/server'
import { JoinCampaign } from './CampClient'
import { ReviewForm } from './FeatClient'
const ICON: any = { clipping: '✂️', ugc: '🎥', influencer: '⭐', posting: '📣' }
const NAME: any = { clipping: 'Clipping', ugc: 'UGC', influencer: 'Influencer', posting: 'Posting' }
export function Cover({ c, h = 150 }: any) {
  return c.image_url ? <img src={c.image_url} alt="" style={{ width: '100%', height: h, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
    : <div style={{ height: h, borderRadius: 12, background: 'linear-gradient(135deg,var(--p),var(--m),var(--o))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{ICON[c.campaign_type] || '🎯'}</div>
}
export function reward(c: any) { return [c.cpm_rate > 0 && `الألف مشاهدة: ${egp(c.cpm_rate)}`, c.fixed_reward > 0 && `ثابت لكل فيديو: ${egp(c.fixed_reward)}`].filter(Boolean).join(' · ') }
export async function CampaignDetails({ id, role }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: c } = await s.from('campaigns').select('*').eq('id', id).maybeSingle()
  if (!c) return <div className="card mu">الحملة غير موجودة أو غير متاحة.</div>
  const r: any = c.requirements || {}
  const { data: rep } = await s.rpc('reputation', { p_user: c.advertiser_id })
  const { data: roster } = role !== 'creator' ? await s.rpc('campaign_roster', { p_campaign: id }) : { data: null }
  const [{ data: app }, { data: com }, { count }] = await Promise.all([
    s.from('campaign_applications').select('status').eq('campaign_id', id).eq('creator_id', user!.id).maybeSingle(),
    s.from('communities').select('id').eq('campaign_id', id).limit(1).maybeSingle(),
    s.from('campaign_applications').select('id', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'accepted')])
  const pct = c.funded_amount > 0 ? Math.min(100, Math.round(c.spent_amount / c.funded_amount * 100)) : 0
  const Row = ({ t, v }: any) => v ? <p><span className="mu">{t}: </span>{v}</p> : null
  const List = ({ t, a }: any) => a?.length ? <div className="card"><b>{t}</b>{a.map((u: string) => <p key={u}><a href={u} target="_blank" rel="noopener noreferrer" dir="ltr" style={{ wordBreak: 'break-all' }}>{u}</a></p>)}</div> : null
  return <><Link href={`/${role}/campaigns`} className="mu">→ رجوع للحملات</Link>
    <Cover c={c} h={200} />
    <div className="row" style={{ marginTop: 12 }}><h2 style={{ margin: 0 }}>{c.title}</h2><span className="badge">{NAME[c.campaign_type]}</span></div><p className="mu">{c.brand_name}{rep?.[0]?.n > 0 && ` · ⭐ ${rep[0].avg_rating} (${rep[0].n})`}</p>
    <div className="card"><p style={{ whiteSpace: 'pre-wrap' }}>{c.description}</p></div>
    <div className="card"><h3>المكافأة والميزانية</h3><Row t="المكافأة" v={reward(c)} />{Number(r.min_views) > 0 && <Row t="الحد الأدنى للمشاهدات لبدء الربح" v={Number(r.min_views).toLocaleString('ar-EG')} />}
      <Row t="الميزانية الإجمالية" v={egp(c.budget)} /><div className="bar" style={{ margin: '8px 0' }}><i style={{ width: pct + '%' }} /></div><p className="mu">تم صرف {pct}% من التمويل المتاح</p></div>
    <div className="card"><h3>التفاصيل</h3><Row t="المنصات" v={(c.platforms || []).join(' · ')} /><Row t="الجمهور المستهدف" v={c.target_audience} /><Row t="مدة الفيديو" v={r.video_length} /><Row t="اللغة" v={r.language} /><Row t="الهاشتاجات والإشارات" v={r.hashtags} />
      <Row t="المبدعون" v={`${count || 0} من ${c.creators_needed}`} /><Row t="البداية" v={c.starts_at && new Date(c.starts_at).toLocaleDateString('ar-EG')} /><Row t="النهاية" v={c.ends_at && new Date(c.ends_at).toLocaleDateString('ar-EG')} />
      <Row t="طريقة القبول" v={r.approval === 'manual' ? 'بموافقة المعلن' : 'انضمام فوري'} /></div>
    {r.guidelines && <div className="card"><b>✅ إرشادات المحتوى</b><p style={{ whiteSpace: 'pre-wrap' }}>{r.guidelines}</p></div>}
    {r.dont && <div className="card"><b>🚫 ممنوعات</b><p style={{ whiteSpace: 'pre-wrap' }}>{r.dont}</p></div>}
    <List t="📁 الخامات" a={r.materials} /><List t="🎬 أمثلة مرجعية" a={r.examples} />
    {r.socials && Object.keys(r.socials).length > 0 && <div className="card"><b>صفحات البراند</b><div className="row" style={{ justifyContent: 'flex-start', marginTop: 8 }}>{Object.entries(r.socials).map(([k, u]: any) => <a key={k} className="btn o" href={u} target="_blank" rel="noopener noreferrer">{k}</a>)}</div></div>}
    {c.link && <p><a className="btn o" href={c.link} target="_blank" rel="noopener noreferrer">رابط إضافي</a></p>}
    {role === 'creator' && <div className="card">{app ? <><p><b>{app.status === 'accepted' ? '✓ أنت منضم لهذه الحملة' : app.status === 'pending' ? 'طلبك بانتظار موافقة المعلن' : 'لم يُقبل طلبك'}</b></p>
      {app.status === 'accepted' && <p className="row"><Link className="btn" href="/creator/submissions">سلّم محتوى</Link>{com && <Link className="btn o" href={`/creator/communities/${com.id}`}>شات الحملة</Link>}</p>}{app.status === 'accepted' && <ReviewForm campaign={id} reviewee={c.advertiser_id} label="قيّم المعلن" />}</>
      : c.status === 'active' ? <JoinCampaign id={id} /> : <p className="mu">الحملة غير نشطة حاليًا.</p>}</div>}
    {role !== 'creator' && <div className="card"><h3>المبدعون المنضمون</h3>{!roster?.length && <p className="mu">لا يوجد منضمون بعد.</p>}{roster?.map((x: any) => <div key={x.creator_id} style={{ padding: '8px 0', borderTop: '1px solid var(--ln)' }}><div className="row"><Link href={`/kit/${x.creator_id}`}><b>{x.name}{x.verified ? ' ✓' : ''}</b></Link><span className="mu">{x.approved} فيديو مقبول</span></div>{x.my_rating ? <span className="badge">قيّمته: {x.my_rating}/5</span> : role === 'advertiser' && x.approved > 0 ? <ReviewForm campaign={id} reviewee={x.creator_id} label="قيّم المبدع" /> : null}</div>)}</div>}</>
}
