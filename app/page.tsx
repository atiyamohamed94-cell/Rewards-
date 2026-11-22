import Link from 'next/link'
import Public from '@/components/Public'
import { sb, egp } from '@/lib/server'
import { getLang } from '@/lib/lang'
export const dynamic = 'force-dynamic'
export default async function Home() {
  const en = (await getLang()) === 'en'; const s = await sb()
  const { data: cs } = await s.from('campaigns').select('id,title,brand_name,cpm_rate,fixed_reward').eq('status', 'active').order('created_at', { ascending: false }).limit(3)
  return <Public><div style={{ textAlign: 'center', padding: '50px 0 30px' }}>
    <h1>{en ? <>Earn from your content, or <span className="g">launch your campaign</span> with measurable results</> : <>اكسب من محتواك، أو <span className="g">أطلق حملتك</span> بنتيجة قابلة للقياس</>}</h1>
    <p className="mu">{en ? 'Brands fund campaigns, creators get paid for verified views, and withdraw in EGP.' : 'البراندات تموّل الحملات، وصنّاع المحتوى يُحاسَبون على المشاهدات الموثّقة، والسحب بالجنيه المصري.'}</p>
    <p><Link className="btn" href="/register?role=creator">{en ? 'Start as a creator' : 'ابدأ كصانع محتوى'}</Link> <Link className="btn o" href="/register?role=advertiser">{en ? 'Launch a campaign' : 'أطلق حملتك كمعلن'}</Link></p></div>
    <div className="grid"><div className="card"><h3>{en ? 'For creators' : 'للمبدعين'}</h3><p className="mu">{en ? 'Apply to campaigns, publish, and cash out via InstaPay or e-wallet.' : 'قدّم على الحملات، انشر، واسحب أرباحك عبر InstaPay أو المحفظة الإلكترونية.'}</p></div>
      <div className="card"><h3>{en ? 'For advertisers' : 'للمعلنين'}</h3><p className="mu">{en ? 'Fund your campaign, pick creators, and review every video before payout.' : 'موّل حملتك، اختر المبدعين، وراجع كل تسليم قبل الصرف.'}</p></div></div>
    {!!cs?.length && <><h2>{en ? 'Active campaigns' : 'حملات نشطة الآن'}</h2><div className="grid">{cs.map((c: any) => <div className="card" key={c.id}><b>{c.brand_name}</b><h3>{c.title}</h3><p className="mu">{c.cpm_rate > 0 ? `CPM: ${egp(c.cpm_rate)}` : `${en ? 'Fixed' : 'مكافأة ثابتة'}: ${egp(c.fixed_reward)}`}</p></div>)}</div></>}</Public>
}
