import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: any[]) => {
      l.forEach(({ name, value }) => req.cookies.set(name, value))
      res = NextResponse.next({ request: req })
      l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) } } })
  const area = ['creator', 'advertiser', 'admin'].find(a => req.nextUrl.pathname.startsWith('/' + a))
  if (!area) return res
  const { data: { user } } = await s.auth.getUser()
  const go = (p: string) => NextResponse.redirect(new URL(p, req.url))
  if (!user) return go('/login')
  const { data: p } = await s.from('profiles').select('role,status').eq('id', user.id).single()
  if (!p || p.status !== 'active') return go('/login')
  if (p.role !== area) return go('/' + p.role + (p.role === 'admin' ? '' : '/campaigns'))
  return res
}
export const config = { matcher: ['/creator/:path*', '/advertiser/:path*', '/admin/:path*'] }
