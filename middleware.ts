import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: any[]) => {
      l.forEach(({ name, value }) => req.cookies.set(name, value))
      res = NextResponse.next({ request: req })
      l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) } } })
  const { data: { session } } = await s.auth.getSession()   // قراءة محلية من الكوكي بدون اتصال بالشبكة، وتجديد الجلسة عند الحاجة
  const p = req.nextUrl.pathname
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url))
  if (['/creator', '/advertiser', '/admin'].some(a => p.startsWith(a))) return session ? res : go('/login')
  if (session) return go('/go')   // مسجّل دخول بالفعل: ادخل للوحتك مباشرة
  return res
}
export const config = { matcher: ['/', '/login', '/register', '/creator/:path*', '/advertiser/:path*', '/admin/:path*'] }
