import Link from 'next/link'
import { SignOut } from './Actions'
const C = [['/communities', 'المجتمعات'], ['/notifications', 'الإشعارات'], ['/analytics', 'التحليلات'], ['/profile', 'حسابي']]
const N: any = { creator: [['/campaigns', 'الحملات'], ['/submissions', 'تسليماتي'], ['/wallet', 'المحفظة'], ...C],
  advertiser: [['/campaigns', 'حملاتي'], ['/applications', 'الطلبات والتسليمات'], ['/wallet', 'المحفظة'], ...C],
  admin: [['', 'الإدارة'], ['/users', 'المستخدمون'], ['/views', 'المشاهدات'], ['/faqs', 'الأسئلة'], ['/analytics', 'التحليلات'], ['/notifications', 'الإشعارات']] }
export default function Shell({ role, children }: any) {
  return <><nav><b className="g">Content Hub</b>{N[role].map(([h, t]: any) => <Link key={h} href={'/' + role + h}>{t}</Link>)}<span style={{ marginInlineStart: 'auto' }}><SignOut /></span></nav><div className="wrap">{children}</div></>
}
