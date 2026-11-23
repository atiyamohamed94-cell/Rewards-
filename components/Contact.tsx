'use client'
import { useState } from 'react'
import { createClient } from '@/lib/client'
const sbc = createClient()
export default function ContactBtn({ user, label = 'تواصل' }: any) {
  const [c, setC] = useState<any>(null); const [err, setErr] = useState('')
  const d = String(c?.phone || '').replace(/\D/g, ''); const wa = /^01\d{9}$/.test(d) ? 'https://wa.me/20' + d.slice(1) : ''
  if (c) return <div className="card"><b>{c.name}</b>{d ? <><p dir="ltr" style={{ textAlign: 'start' }}>{c.phone}</p><div className="row"><a className="btn o" href={'tel:' + d}>اتصال</a>{wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">واتساب</a>}</div></> : <p className="mu">لم يضف رقم هاتف.</p>}</div>
  return <span><button className="btn o" onClick={async () => { const { data, error } = await sbc.rpc('get_contact', { p_user: user }); if (error) setErr(error.message); else setC(data) }}>📞 {label}</button>{err && <span className="mu"> {err}</span>}</span>
}
