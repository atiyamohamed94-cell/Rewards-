import Link from 'next/link'
import Logo from './Logo'
const L = [['/how-it-works', 'كيف تعمل'], ['/pricing', 'الأسعار'], ['/faq', 'الأسئلة'], ['/contact', 'تواصل']]
export default function Public({ children }: any) {
  return <><nav style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
    <Link href="/"><Logo h={34} /></Link>
    <span style={{ display: 'flex', gap: 8 }}><Link className="btn o" href="/login">تسجيل الدخول</Link><Link className="btn" href="/register">إنشاء حساب</Link></span>
    <span style={{ display: 'flex', gap: 14, width: '100%', overflowX: 'auto' }}>{L.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}</span></nav>
    <div className="wrap">{children}</div><footer className="wrap mu" style={{ textAlign: 'center' }}><Link href="/terms">الشروط والأحكام</Link> · <Link href="/privacy">سياسة الخصوصية</Link></footer></>
}
