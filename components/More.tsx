import Link from 'next/link'
import { sb } from '@/lib/server'
import { SignOut } from './Actions'
import { DEFAULT_SUPPORT, waLink } from '@/lib/support'
import { PasswordForm, RoleRequest, SupportEdit } from './Forms'
async function phone() { const s = await sb(); const { data } = await s.from('platform_settings').select('value').eq('key', 'support_contact').maybeSingle()
  const v: any = data?.value; return String(typeof v === 'string' ? v : v?.phone || v?.whatsapp || '') || DEFAULT_SUPPORT }
export async function Support() {
  const t = await phone(); const d = t.replace(/\D/g, ''); const wa = waLink(t)
  return <div className="card"><h3>الدعم والتواصل</h3>{t ? <><p dir="ltr" style={{ textAlign: 'right' }}>{t}</p><div className="row"><a className="btn o" href={'tel:' + d}>اتصال</a>{wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">واتساب</a>}</div></> : <p className="mu">رقم الدعم غير مُضاف بعد.</p>}</div>
}
const LK: any = { creator: [['/profile', 'حسابي والحسابات الاجتماعية'], ['/notifications', 'الإشعارات'], ['/analytics', 'التحليلات'], ['/settings', 'الإعدادات']],
  advertiser: [['/profile', 'حسابي والنشاط التجاري'], ['/notifications', 'الإشعارات'], ['/analytics', 'التحليلات'], ['/settings', 'الإعدادات']],
  admin: [['/notifications', 'الإشعارات'], ['/analytics', 'التحليلات'], ['/faqs', 'الأسئلة الشائعة'], ['/disputes', 'الطلبات والنزاعات']] }
export async function More({ role }: any) {
  return <><h2>المزيد</h2><div className="card list">{LK[role].map(([h, t]: any) => <Link key={h} href={'/' + role + h}>{t} <span>‹</span></Link>)}</div>
    {role === 'admin' ? <SupportEdit current={await phone()} /> : <Support />}<SignOut /></>
}
export async function Settings({ role }: any) {
  const s = await sb(); const { data: { user } } = await s.auth.getUser()
  return <><h2>الإعدادات</h2><p className="mu">{user?.email}</p><PasswordForm /><RoleRequest uid={user!.id} role={role} /><Support /></>
}
