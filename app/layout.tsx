import './globals.css'
import { Cairo } from 'next/font/google'
import { getLang } from '@/lib/lang'
import { LangProvider } from '@/components/Lang'
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font' })
export const metadata = { title: 'Content Hub Egypt', description: 'منصة التسويق بالمحتوى في مصر', appleWebApp: { capable: true, title: 'Content Hub' } }
export const viewport = { themeColor: '#10101B', width: 'device-width', initialScale: 1, viewportFit: 'cover' }
export default async function L({ children }: any) {
  const lang = await getLang()
  return <html lang={lang} dir={lang === 'en' ? 'ltr' : 'rtl'} className={cairo.variable}><body><LangProvider lang={lang}>{children}</LangProvider></body></html>
}
