import Link from 'next/link'
import { sb } from '@/lib/server'
import { getLang } from '@/lib/lang'
import { DEFAULT_SUPPORT, waLink } from '@/lib/support'
import { SignOut } from './Actions'
import { PasswordForm, RoleRequest, SupportEdit } from './Forms'
async function phone() { const s = await sb(); const { data } = await s.from('platform_settings').select('value').eq('key', 'support_contact').maybeSingle()
  const v: any = data?.value; return String(typeof v === 'string' ? v : v?.phone || v?.whatsapp || '') || DEFAULT_SUPPORT }
export async function Support() {
  const en = (await getLang()) === 'en'; const t = await phone(); const d = t.replace(/\D/g, ''); const wa = waLink(t)
  return <div className="card"><h3>{en ? 'Support' : 'الدعم والتواصل'}</h3><p dir="ltr" style={{ textAlign: en ? 'left' : 'right' }}>{t}</p><div className="row"><a className="btn o" href={'tel:' + d}>{en ? 'Call' : 'اتصال'}</a>{wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div></div>
}
const LK: any = { creator: [['/profile', 'حسابي والحسابات الاجتماعية', 'My profile & socials'], ['/leaderboard', '🏆 المتصدرون ومستواي', '🏆 Leaderboard & my level'], ['/notifications', 'الإشعارات', 'Notifications'], ['/analytics', 'التحليلات', 'Analytics'], ['/settings', 'الإعدادات', 'Settings']],
  advertiser: [['/profile', 'حسابي والنشاط التجاري', 'My profile & business'], ['/leaderboard', '🏆 أفضل المبدعين', '🏆 Top creators'], ['/claims', 'مراجعة مشاهدات المبدعين', 'Creator view claims'], ['/notifications', 'الإشعارات', 'Notifications'], ['/analytics', 'التحليلات', 'Analytics'], ['/settings', 'الإعدادات', 'Settings']],
  admin: [['/claims', 'طلبات توثيق المشاهدات', 'View claims'], ['/campaigns', 'كل الحملات', 'All campaigns'], ['/disputes', 'الطلبات والنزاعات', 'Requests & disputes'], ['/views', 'إدخال مشاهدات يدويًا (استثنائي)', 'Manual views (exception)'], ['/faqs', 'الأسئلة الشائعة', 'FAQ'], ['/settings', 'إعدادات المنصة', 'Platform settings'], ['/logs', 'سجل العمليات', 'Activity log'], ['/analytics', 'التحليلات', 'Analytics'], ['/notifications', 'الإشعارات', 'Notifications']] }
export async function More({ role }: any) {
  const en = (await getLang()) === 'en'
  return <><h2>{en ? 'More' : 'المزيد'}</h2><div className="card list">{LK[role].map(([h, a, e]: any) => <Link key={h} href={'/' + role + h}>{en ? e : a} <span>›</span></Link>)}</div>
    {role === 'admin' ? <SupportEdit current={await phone()} /> : <Support />}<SignOut /></>
}
export async function Settings({ role }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  return <><h2>الإعدادات</h2><p className="mu">{user?.email}</p><PasswordForm /><RoleRequest uid={user!.id} role={role} /><Support /></>
}
