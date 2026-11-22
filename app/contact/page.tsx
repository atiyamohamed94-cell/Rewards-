import Public from '@/components/Public'
import { sb } from '@/lib/server'
import { DEFAULT_SUPPORT, waLink } from '@/lib/support'
export const dynamic = 'force-dynamic'
export default async function P() {
  const s = await sb(); const { data } = await s.from('platform_settings').select('value').eq('key', 'support_contact').maybeSingle()
  const v: any = data?.value; const t = String(typeof v === 'string' ? v : v?.phone || v?.whatsapp || '') || DEFAULT_SUPPORT; const wa = waLink(t)
  return <Public><h1>تواصل معنا</h1><div className="card"><p>لأي مشكلة أو استفسار تواصل معنا على:</p><p dir="ltr" style={{ textAlign: 'right', fontSize: 22 }}>{t}</p>
    <div className="row"><a className="btn o" href={'tel:' + t.replace(/\D/g, '')}>اتصال</a>{wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">واتساب</a>}</div></div></Public>
}
