'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
const sbc = createClient()
export default function AdvWithdraw({ available }: { available: number }) {
  const r = useRouter()
  const [amt, setAmt] = useState(''); const [m, setM] = useState('instapay'); const [d, setD] = useState(''); const [n, setN] = useState('')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  async function send() {
    if (+amt < 50 || !d.trim() || !n.trim()) return alert('أكمل البيانات (الحد الأدنى 50 ج.م)')
    if (+amt > available) return alert('المبلغ أكبر من رصيدك المتاح')
    setBusy(true); setMsg('')
    const { error } = await sbc.rpc('request_advertiser_refund', { p_amount: +amt, p_method: m, p_details: { account: d.trim(), name: n.trim() } })
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg('تم إرسال طلب السحب'); setAmt(''); r.refresh()
  }
  return <div className="card"><h3>سحب الرصيد</h3>
    <p className="mu">يمكنك سحب رصيدك غير المستخدم في أي حملة. تُخصم رسوم سحب 5%.</p>
    <label>المبلغ (الحد الأدنى 50 ج.م)</label><input type="number" value={amt} onChange={e => setAmt(e.target.value)} />{+amt > 0 && <p className="mu">رسوم السحب 5%: {(+amt * 0.05).toFixed(2)} ج.م · الصافي لك: {(+amt * 0.95).toFixed(2)} ج.م</p>}
    <label>الطريقة</label><select value={m} onChange={e => setM(e.target.value)}><option value="instapay">InstaPay</option><option value="ewallet">محفظة إلكترونية</option></select>
    <label>{m === 'instapay' ? 'عنوان InstaPay' : 'رقم المحفظة'}</label><input value={d} onChange={e => setD(e.target.value)} />
    <label>اسم صاحب الحساب</label><input value={n} onChange={e => setN(e.target.value)} />
    <button className="btn" disabled={busy || available < 50} onClick={send}>إرسال طلب السحب</button>
    {available < 50 && <p className="mu">رصيدك المتاح أقل من الحد الأدنى للسحب.</p>}
    {msg && <p className="mu" role="status">{msg}</p>}</div>
}
