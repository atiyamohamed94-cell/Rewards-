import { NextResponse } from 'next/server'
import { sb } from '@/lib/server'
export async function GET(req: Request) {
  const origin = new URL(req.url).origin; const s = await sb()
  const { data: { user } } = await s.auth.getUser()
  if (user) {
    const { data: p } = await s.from('profiles').select('role,status').eq('id', user.id).single()
    if (p && p.status === 'active') return NextResponse.redirect(origin + (p.role === 'admin' ? '/admin' : `/${p.role}/campaigns`))
  }
  await s.auth.signOut()
  return NextResponse.redirect(origin + '/login')
}
