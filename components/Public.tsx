import Link from 'next/link'
const L = [['/how-it-works', 'كيف تعمل'], ['/pricing', 'الأسعار'], ['/faq', 'الأسئلة'], ['/contact', 'تواصل']]
export default function Public({ children }: any) {
  return <><nav><Link href="/"><b className="g">Content Hub</b></Link>{L.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}<span style={{ marginInlineStart: 'auto' }}><Link className="btn o" href="/login">دخول</Link></span></nav>
    <div className="wrap">{children}</div><footer className="wrap mu" style={{ textAlign: 'center' }}><Link href="/terms">الشروط والأحكام</Link> · <Link href="/privacy">سياسة الخصوصية</Link></footer></>
}
