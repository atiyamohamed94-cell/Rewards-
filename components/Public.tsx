import Link from 'next/link'
import Logo from './Logo'
import { LangToggle } from './Lang'
import { getLang } from '@/lib/lang'
const L = [['/how-it-works', 'كيف تعمل', 'How it works'], ['/pricing', 'الأسعار', 'Pricing'], ['/faq', 'الأسئلة', 'FAQ'], ['/contact', 'تواصل', 'Contact']]
export default async function Public({ children }: any) {
  const en = (await getLang()) === 'en'
  return <><nav style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
    <Link href="/"><Logo h={34} /></Link>
    <span style={{ display: 'flex', gap: 8 }}><LangToggle /><Link className="btn o" href="/login">{en ? 'Log in' : 'تسجيل الدخول'}</Link><Link className="btn" href="/register">{en ? 'Sign up' : 'إنشاء حساب'}</Link></span>
    <span style={{ display: 'flex', gap: 14, width: '100%', overflowX: 'auto' }}>{L.map(([h, a, e]) => <Link key={h} href={h}>{en ? e : a}</Link>)}</span></nav>
    <div className="wrap">{children}</div><footer className="wrap mu" style={{ textAlign: 'center' }}><Link href="/terms">{en ? 'Terms' : 'الشروط والأحكام'}</Link> · <Link href="/privacy">{en ? 'Privacy' : 'سياسة الخصوصية'}</Link></footer></>
}
