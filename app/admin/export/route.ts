import { NextResponse } from 'next/server'
import { sb } from '@/lib/server'
const T: any = { wallet_transactions: '*', withdrawal_requests: '*', payment_requests: '*', campaigns: '*', submissions: '*', view_claims: '*', profiles: 'id,email,full_name,role,status,created_at' }
export async function GET(req: Request) {
  const s = await sb(); const { data: { user } } = await s.auth.getUser(); if (!user) return new NextResponse('unauthorized', { status: 401 })
  const { data: p } = await s.from('profiles').select('role').eq('id', user.id).single(); if (p?.role !== 'admin') return new NextResponse('forbidden', { status: 403 })
  const t = new URL(req.url).searchParams.get('t') || ''; if (!T[t]) return new NextResponse('bad table', { status: 400 })
  const { data, error } = await s.from(t).select(T[t]).limit(10000); if (error) return new NextResponse(error.message, { status: 500 })
  const rows: any[] = data || []; const cols = Object.keys(rows[0] || {}); const q = (v: any) => '"' + String(v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""') + '"'
  const csv = '\uFEFF' + [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n')
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${t}-${new Date().toISOString().slice(0, 10)}.csv"` } })
}
