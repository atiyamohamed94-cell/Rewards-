import Public from '@/components/Public'
import { sb } from '@/lib/server'
export const dynamic = 'force-dynamic'
export default async function P() { const s = await sb(); const { data } = await s.from('platform_settings').select('value').eq('key', 'support_contact').maybeSingle()
  const v: any = data?.value; const t = typeof v === 'string' ? v : v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}: ${x}`).join(' · ') : ''
  return <Public><h1>تواصل معنا</h1><div className="card">{t ? <p>{t}</p> : <p className="mu">بيانات التواصل غير متاحة حاليًا.</p>}</div></Public> }
