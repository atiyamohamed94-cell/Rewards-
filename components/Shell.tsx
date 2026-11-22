'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import { RefClaim } from './Ref'
import { LangToggle, useLang } from './Lang'
import { createClient } from '@/lib/client'
const T: any = {
  creator: [['/campaigns', '🎯', 'الحملات', 'Campaigns'], ['/submissions', '🎬', 'تسليماتي', 'My videos'], ['/communities', '💬', 'المجتمعات', 'Groups'], ['/wallet', '👛', 'المحفظة', 'Wallet'], ['/more', '☰', 'المزيد', 'More']],
  advertiser: [['/campaigns', '📣', 'حملاتي', 'Campaigns'], ['/applications', '✅', 'الطلبات', 'Requests'], ['/communities', '💬', 'المجتمعات', 'Groups'], ['/wallet', '👛', 'المحفظة', 'Wallet'], ['/more', '☰', 'المزيد', 'More']],
  admin: [['', '🛡️', 'الرئيسية', 'Home'], ['/review', '✅', 'المراجعة', 'Review'], ['/finance', '💰', 'المالية', 'Finance'], ['/users', '👥', 'المستخدمون', 'Users'], ['/more', '☰', 'المزيد', 'More']] }
export default function Shell({ role, children }: any) {
  const p = usePathname(); const { lang } = useLang(); const [n, setN] = useState(0)
  useEffect(() => { const sb = createClient(); let on = true
    const f = async () => { const { data: { session } } = await sb.auth.getSession(); const user = session?.user; if (!user) return
      const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false); if (on) setN(count || 0) }
    f(); const iv = setInterval(f, 30000); return () => { on = false; clearInterval(iv) } }, [p])
  return <><header className="top"><Link href={'/' + role + T[role][0][0]}><Logo /></Link>
    <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}><LangToggle /><Link href={'/' + role + '/notifications'} aria-label="notifications" style={{ position: 'relative' }}>🔔{n > 0 && <span className="badge" style={{ position: 'absolute', top: -6, insetInlineEnd: -10, background: 'var(--m)', color: '#fff' }}>{n > 9 ? '9+' : n}</span>}</Link></span></header>
    <RefClaim /><div className="wrap app">{children}</div>
    <nav className="tabs">{T[role].map(([h, i, a, e]: any) => { const href = '/' + role + h; const on = h === '' ? p === href : p.startsWith(href)
      return <Link key={h} href={href} className={on ? 'on' : ''}><span>{i}</span>{lang === 'en' ? e : a}</Link> })}</nav></>
}
