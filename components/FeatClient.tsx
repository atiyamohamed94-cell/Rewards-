'use client'
import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRun } from './Forms'
const sbc = createClient()
export function ReviewForm({ campaign, reviewee, label }: any) {
  const { busy, msg, run } = useRun(); const [r, setR] = useState(5); const [c, setC] = useState(''); const [open, setOpen] = useState(false)
  if (!open) return <button className="btn o" onClick={() => setOpen(true)}>⭐ {label}</button>
  return <div className="card"><b>{label}</b><div className="row" style={{ justifyContent: 'flex-start', fontSize: 28 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} role="button" aria-label={i + ' stars'} style={{ cursor: 'pointer', opacity: i <= r ? 1 : .3 }} onClick={() => setR(i)}>⭐</span>)}</div>
    <textarea rows={2} maxLength={500} placeholder="تعليق (اختياري)" value={c} onChange={e => setC(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => run(() => sbc.rpc('submit_review', { p_campaign: campaign, p_reviewee: reviewee, p_rating: r, p_comment: c || null }), 'شكرًا على تقييمك')}>إرسال التقييم</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function InviteBtn({ creator, campaigns }: any) {
  const { busy, msg, run } = useRun(); const [c, setC] = useState(campaigns[0]?.id || '')
  if (!campaigns.length) return <span className="mu">لا توجد حملة نشطة للدعوة</span>
  return <div><select value={c} onChange={e => setC(e.target.value)}>{campaigns.map((x: any) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
    <button className="btn o" disabled={busy} onClick={() => run(() => sbc.rpc('invite_creator', { p_campaign: c, p_creator: creator }), 'تم إرسال الدعوة')}>دعوة للحملة</button>{msg && <p className="mu">{msg}</p>}</div>
}
export function CopyBtn({ text }: any) {
  const [ok, setOk] = useState(false)
  return <button className="btn o" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) } catch { prompt('انسخ الرابط', text) } }}>{ok ? 'تم النسخ ✓' : 'نسخ الرابط'}</button>
}
