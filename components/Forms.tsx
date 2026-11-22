'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
const sbc = createClient()
function useRun() { const r = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const run = async (f: () => PromiseLike<any>, ok = 'تم الحفظ') => { setBusy(true); setMsg(''); const { error } = await f(); setBusy(false); if (error) setMsg(error.message); else { setMsg(ok); r.refresh() } }
  return { busy, msg, run } }
export function PasswordForm() {
  const { busy, msg, run } = useRun(); const [p, setP] = useState('')
  return <div className="card"><h3>تغيير كلمة المرور</h3><input type="password" placeholder="كلمة مرور جديدة (8 أحرف على الأقل)" value={p} onChange={e => setP(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (p.length < 8) return alert('8 أحرف على الأقل'); run(() => sbc.auth.updateUser({ password: p }), 'تم تغيير كلمة المرور') }}>حفظ</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function RoleRequest({ uid, role }: any) {
  const { busy, msg, run } = useRun(); const to = role === 'creator' ? 'معلن' : 'صانع محتوى'; const [d, setD] = useState('')
  return <div className="card"><h3>طلب تغيير نوع الحساب</h3><p className="mu">نوع حسابك الحالي: {role === 'creator' ? 'صانع محتوى' : 'معلن'}. لا يتم التغيير تلقائيًا حفاظًا على رصيدك وحملاتك، وتراجع الإدارة طلبك.</p>
    <textarea placeholder={`لماذا تريد التحويل إلى ${to}؟`} value={d} onChange={e => setD(e.target.value)} />
    <button className="btn o" disabled={busy} onClick={() => run(() => sbc.from('disputes').insert({ reporter_id: uid, subject: `طلب تغيير نوع الحساب إلى ${to}`, details: d, status: 'open' }), 'تم إرسال طلبك للإدارة')}>إرسال الطلب</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function SupportEdit({ current }: any) {
  const { busy, msg, run } = useRun(); const [v, setV] = useState(current || '')
  return <div className="card"><h3>رقم الدعم</h3><input dir="ltr" inputMode="tel" placeholder="01XXXXXXXXX" value={v} onChange={e => setV(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (!/^01\d{9}$/.test(v.replace(/\s/g, ''))) return alert('رقم مصري من 11 رقمًا يبدأ بـ 01')
      run(() => sbc.from('platform_settings').upsert({ key: 'support_contact', value: v.replace(/\s/g, '') }, { onConflict: 'key' })) }}>حفظ</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function ResolveBtn({ id }: any) {
  const { busy, run } = useRun()
  return <button className="btn o" disabled={busy} onClick={() => run(() => sbc.from('disputes').update({ status: 'resolved' }).eq('id', id), 'تم')}>تمت المعالجة</button>
}
