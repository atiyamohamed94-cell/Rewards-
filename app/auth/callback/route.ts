import { NextResponse } from 'next/server'
import { sb } from '@/lib/server'
export async function GET(req: Request) {
  const url = new URL(req.url); const code = url.searchParams.get('code'); const n = url.searchParams.get('next') || '/go'
  const next = n.startsWith('/') && !n.startsWith('//') ? n : '/go'
  if (code) { const s = await sb(); const { error } = await s.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(url.origin + next) }
  return NextResponse.redirect(url.origin + '/login')
}
