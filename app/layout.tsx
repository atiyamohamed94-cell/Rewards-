import './globals.css'
import { Cairo } from 'next/font/google'
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font' })
export const metadata = { title: 'Content Hub Egypt', description: 'منصة التسويق بالمحتوى في مصر', appleWebApp: { capable: true, title: 'Content Hub' } }
export const viewport = { themeColor: '#10101B', width: 'device-width', initialScale: 1, viewportFit: 'cover' }
export default function L({ children }: any) { return <html lang="ar" dir="rtl" className={cairo.variable}><body>{children}</body></html> }
