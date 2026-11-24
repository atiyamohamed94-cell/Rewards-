'use client'
import { useState } from 'react'
import { createClient } from '@/lib/client'
export default function ShareCampaign({ id, title }: any) {
  const [ok, setOk] = useState(false)
  async function go() {
    let code = ''
    try { const { data } = await createClient().rpc('my_referral_code'); if (typeof data === 'string') code = data } catch {}
    const url = `${location.origin}/c/${id}${code ? `?ref=${code}` : ''}`
    try { if (navigator.share) { await navigator.share({ title, url }); return } } catch { return }
    try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 2000) } catch { prompt('انسخ الرابط', url) }
  }
  return <button className="btn o" onClick={go}>{ok ? 'تم نسخ الرابط ✓' : '🔗 شارك الحملة'}</button>
}
