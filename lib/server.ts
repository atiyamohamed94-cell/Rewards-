import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function sb() {
  const c = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => c.getAll(), setAll: (l: any[]) => { try { l.forEach(({ name, value, options }) => c.set(name, value, options)) } catch {} } } })
}
export const egp = (n: any) => Number(n || 0).toLocaleString('ar-EG') + ' ج.م'
export const monthly = (rows: any[], dk: string, vk?: string) => { const m: any = {}
  rows.forEach(r => { const k = String(r[dk] || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + (vk ? Number(r[vk]) : 1) })
  return Object.entries(m).sort().slice(-12) as [string, number][] }
