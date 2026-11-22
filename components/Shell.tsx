'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
const T: any = {
  creator: [['/campaigns', '🎯', 'الحملات'], ['/submissions', '🎬', 'تسليماتي'], ['/communities', '💬', 'المجتمعات'], ['/wallet', '👛', 'المحفظة'], ['/more', '☰', 'المزيد']],
  advertiser: [['/campaigns', '📣', 'حملاتي'], ['/applications', '✅', 'الطلبات'], ['/communities', '💬', 'المجتمعات'], ['/wallet', '👛', 'المحفظة'], ['/more', '☰', 'المزيد']],
  admin: [['', '🛡️', 'الإدارة'], ['/users', '👥', 'المستخدمون'], ['/views', '👁️', 'المشاهدات'], ['/more', '☰', 'المزيد']] }
export default function Shell({ role, children }: any) {
  const p = usePathname()
  return <><header className="top"><Link href={'/' + role + T[role][0][0]}><Logo /></Link><Link href={'/' + role + '/notifications'} aria-label="الإشعارات">🔔</Link></header>
    <div className="wrap app">{children}</div>
    <nav className="tabs">{T[role].map(([h, i, t]: any) => { const href = '/' + role + h; const on = h === '' ? p === href : p.startsWith(href)
      return <Link key={h} href={href} className={on ? 'on' : ''}><span>{i}</span>{t}</Link> })}</nav></>
}
