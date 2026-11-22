import Link from 'next/link'
import Public from '@/components/Public'
import { sb, egp } from '@/lib/server'
import { getLang } from '@/lib/lang'
export const dynamic = 'force-dynamic'
export default async function Home() {
  const en = (await getLang()) === 'en'; const t = (a: string, e: string) => en ? e : a; const s = await sb()
  const [{ data: cs }, { data: fq }] = await Promise.all([
    s.from('campaigns').select('id,title,brand_name,cpm_rate,fixed_reward').eq('status', 'active').order('created_at', { ascending: false }).limit(3),
    s.from('faqs').select('id,question,answer').eq('is_published', true).order('sort_order').limit(4)])
  const cre = [t('سجّل واختر الحملات المناسبة لك', 'Sign up and pick campaigns that fit you'), t('انشر الفيديو وأرسل الرابط للمراجعة', 'Publish your video and submit the link'), t('وثّق مشاهداتك واسحب أرباحك بالجنيه', 'Verify your views and cash out in EGP')]
  const adv = [t('أنشئ حملتك وحدد الميزانية والمكافأة', 'Create a campaign with your budget and reward'), t('موّلها واختر المبدعين الذين تقبلهم', 'Fund it and accept the creators you want'), t('راجع كل فيديو، ولا تدفع إلا على مشاهدات موثّقة', 'Review each video and pay only for verified views')]
  const why = [['✅', t('مشاهدات موثّقة', 'Verified views'), t('كل رقم مشاهدات يُراجَع بالدليل قبل صرف أي مبلغ.', 'Every view count is checked against proof before any payout.')],
    ['🔒', t('تمويل مضمون', 'Funded upfront'), t('ميزانية الحملة تُموَّل مقدمًا، فالمبدع يعرف أن حقه موجود.', 'Campaign budgets are funded in advance, so creators know the money is there.')],
    ['🇪🇬', t('دفع محلي', 'Local payments'), t('الشحن والسحب عبر InstaPay والمحافظ الإلكترونية بالجنيه المصري.', 'Top up and withdraw via InstaPay and e-wallets in EGP.')],
    ['🏆', t('مستويات ومنافسة', 'Levels & leaderboard'), t('ارتقِ من برونزي إلى ماسي وتصدّر قائمة أفضل المبدعين.', 'Climb from Bronze to Diamond and top the creator leaderboard.')],
    ['💬', t('مجتمعات وشات', 'Group chats'), t('مجتمع عام وشات خاص لكل حملة للتواصل المباشر.', 'A public community and a private chat for every campaign.')],
    ['🛡️', t('مراجعة بشرية', 'Human review'), t('فريق الإدارة يراجع الحملات والدفعات والخلافات.', 'Our team reviews campaigns, payments and disputes.')]]
  const lv = [['🥉', t('برونزي', 'Bronze')], ['🥈', t('فضي', 'Silver')], ['🥇', t('ذهبي', 'Gold')], ['💎', t('بلاتيني', 'Platinum')], ['👑', t('ماسي', 'Diamond')]]
  return <Public>
    <div className="hero"><span className="pill">🇪🇬 {t('صُنع للسوق المصري', 'Built for Egypt')}</span><span className="pill">InstaPay</span><span className="pill">{t('محافظ إلكترونية', 'E-wallets')}</span>
      <h1>{en ? <>Earn from your content, or <span className="g">launch your campaign</span> with measurable results</> : <>اكسب من محتواك، أو <span className="g">أطلق حملتك</span> بنتيجة قابلة للقياس</>}</h1>
      <p className="mu">{t('البراندات تموّل الحملات، وصنّاع المحتوى يُحاسَبون على المشاهدات الموثّقة، والسحب بالجنيه المصري.', 'Brands fund campaigns, creators get paid for verified views, and withdraw in EGP.')}</p>
      <p><Link className="btn" href="/register?role=creator">{t('ابدأ كصانع محتوى', 'Start as a creator')}</Link> <Link className="btn o" href="/register?role=advertiser">{t('أطلق حملتك كمعلن', 'Launch a campaign')}</Link></p></div>
    <h2>{t('كيف تعمل المنصة؟', 'How it works')}</h2>
    <div className="grid"><div className="card"><h3>🎬 {t('للمبدعين', 'For creators')}</h3>{cre.map((x, i) => <p key={i}><span className="g big">{i + 1}</span> {x}</p>)}</div>
      <div className="card"><h3>📣 {t('للمعلنين', 'For advertisers')}</h3>{adv.map((x, i) => <p key={i}><span className="g big">{i + 1}</span> {x}</p>)}</div></div>
    <h2>{t('لماذا Content Hub؟', 'Why Content Hub?')}</h2>
    <div className="grid">{why.map(([i, h, d]) => <div className="card" key={h}><div className="big">{i}</div><b>{h}</b><p className="mu">{d}</p></div>)}</div>
    <div className="card" style={{ textAlign: 'center' }}><h3>{t('مستويات المبدعين', 'Creator levels')}</h3><p className="mu">{t('كلما زادت مشاهداتك الموثّقة ارتفع مستواك.', 'The more verified views you earn, the higher your level.')}</p>
      <div className="row" style={{ justifyContent: 'space-around' }}>{lv.map(([i, n]) => <span key={n}><span className="big">{i}</span><br /><span className="mu">{n}</span></span>)}</div></div>
    <div className="card"><h3>{t('رسوم واضحة', 'Simple, transparent fees')}</h3><div className="grid"><div><div className="big g">15%</div><p className="mu">{t('عمولة على المعلن عند تمويل الحملة', 'Advertiser fee when funding a campaign')}</p></div>
      <div><div className="big g">5%</div><p className="mu">{t('رسوم على المبدع عند السحب', 'Creator fee on withdrawal')}</p></div><div><div className="big g">{t('50 ج.م', '50 EGP')}</div><p className="mu">{t('الحد الأدنى للسحب', 'Minimum withdrawal')}</p></div></div>
      <Link href="/pricing" className="mu">{t('التفاصيل مع مثال ←', 'Details with an example →')}</Link></div>
    {!!cs?.length && <><h2>{t('حملات نشطة الآن', 'Active campaigns')}</h2><div className="grid">{cs.map((c: any) => <div className="card" key={c.id}><b>{c.brand_name}</b><h3>{c.title}</h3><p className="mu">{c.cpm_rate > 0 ? `CPM: ${egp(c.cpm_rate)}` : `${t('مكافأة ثابتة', 'Fixed')}: ${egp(c.fixed_reward)}`}</p></div>)}</div></>}
    {!!fq?.length && <><h2>{t('أسئلة شائعة', 'FAQ')}</h2>{fq.map((f: any) => <details className="card" key={f.id}><summary><b>{f.question}</b></summary><p className="mu">{f.answer}</p></details>)}<p><Link href="/faq" className="mu">{t('كل الأسئلة ←', 'All questions →')}</Link></p></>}
    <div className="card" style={{ textAlign: 'center' }}><h2>{t('جاهز تبدأ؟', 'Ready to start?')}</h2><p><Link className="btn" href="/register">{t('إنشاء حساب مجاني', 'Create a free account')}</Link> <Link className="btn o" href="/contact">{t('تواصل معنا', 'Contact us')}</Link></p></div>
  </Public>
}
