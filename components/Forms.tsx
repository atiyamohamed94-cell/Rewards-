'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
const sbc = createClient()
export function useRun() { const r = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
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
export function RoleChangeActions({ id }: { id: string }) {
  const { busy, msg, run } = useRun()
  const [note, setNote] = useState('')

  const review = (decision: 'approved' | 'rejected') => {
    const label = decision === 'approved' ? 'قبول الطلب' : 'رفض الطلب'
    if (!confirm(`هل أنت متأكد من ${label}؟`)) return

    run(
      () => sbc.rpc('admin_review_role_change', {
        p_request: id,
        p_decision: decision,
        p_note: note,
      }),
      decision === 'approved' ? 'تم قبول الطلب وتغيير نوع الحساب' : 'تم رفض الطلب'
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      <textarea
        placeholder="ملاحظة الإدارة (اختياري)"
        value={note}
        onChange={e => setNote(e.target.value)}
        disabled={busy}
      />
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <button
          className="btn"
          disabled={busy}
          onClick={() => review('approved')}
          style={{ background: '#16a34a', color: '#fff' }}
        >
          {busy ? 'جارٍ التنفيذ...' : '✓ قبول الطلب'}
        </button>
        <button
          className="btn"
          disabled={busy}
          onClick={() => review('rejected')}
          style={{ background: '#dc2626', color: '#fff' }}
        >
          {busy ? 'جارٍ التنفيذ...' : '✕ رفض الطلب'}
        </button>
      </div>
      {msg && <p className="mu" role="status">{msg}</p>}
    </div>
  )
}
export function VerifyBtn({ id, role, on }: any) {
  const { busy, msg, run } = useRun(); const t = role === 'advertiser' ? 'advertiser_profiles' : 'creator_profiles'
  return <span><button className="btn o" disabled={busy} onClick={() => run(async () => { const r = await sbc.from(t).update({ verified: !on }).eq('user_id', id).select('user_id')
    if (r.error) return r; if (!r.data?.length) return { error: { message: 'لا يوجد ملف تفصيلي لهذا المستخدم' } }
    await sbc.from('admin_logs').insert({ action: on ? 'unverify' : 'verify', target_type: t, target_id: id }); return r }, 'تم')}>{on ? 'إلغاء التوثيق' : 'توثيق ✓'}</button>{msg && <span className="mu"> {msg}</span>}</span>
}
export function ClaimForm({ sid, uid }: any) {
  const { busy, msg, run } = useRun(); const [v, setV] = useState(''); const [f, setF] = useState<File | null>(null)
  return <div style={{ borderTop: '1px solid var(--ln)', marginTop: 10, paddingTop: 10 }}><b>طلب توثيق مشاهدات</b>
    <input type="number" placeholder="عدد المشاهدات الحالي" value={v} onChange={e => setV(e.target.value)} />
    <label>صورة من إحصائيات حسابك (Analytics) تُظهر الرقم واسم حسابك والفيديو</label><input type="file" accept="image/*" onChange={e => setF(e.target.files?.[0] || null)} />
    <button className="btn" disabled={busy} onClick={() => run(async () => { if (!f || !(+v > 0)) return { error: { message: 'أدخل العدد وأرفق الصورة' } }; if (f.size > 5e6) return { error: { message: 'الصورة أكبر من 5MB' } }
      const path = `${uid}/${Date.now()}-${f.name.replace(/[^\w.]/g, '_')}`; const up = await sbc.storage.from('view-proofs').upload(path, f); if (up.error) return up
      return sbc.rpc('submit_view_claim', { p_submission: sid, p_views: Math.floor(+v), p_proof: path }) }, 'تم إرسال الطلب للمراجعة')}>إرسال الطلب</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function CampStatus({ id, to, label }: any) {
  const { busy, run } = useRun()
  return <button className="btn o" disabled={busy} onClick={() => { if (confirm(label + '؟')) run(async () => { const r = await sbc.from('campaigns').update({ status: to }).eq('id', id); if (r.error) return r
    await sbc.from('admin_logs').insert({ action: 'campaign_' + to, target_type: 'campaign', target_id: id }); return r }, 'تم') }}>{label}</button>
}
export function SettingEdit({ k, current }: any) {
  const { busy, msg, run } = useRun(); const init = typeof current === 'string' ? current : JSON.stringify(current); const [v, setV] = useState(init)
  return <div className="card"><label dir="ltr" style={{ display: 'block', textAlign: 'start' }}><b>{k}</b></label><textarea dir="ltr" rows={2} value={v} onChange={e => setV(e.target.value)} />
    <button className="btn" disabled={busy || v === init} onClick={() => run(async () => { let val: any = v; try { val = JSON.parse(v) } catch {}
      const r = await sbc.from('platform_settings').upsert({ key: k, value: val }, { onConflict: 'key' }); if (r.error) return r
      await sbc.from('admin_logs').insert({ action: 'setting_update', target_type: 'platform_settings', details: { key: k } }); return r })}>حفظ</button>{msg && <span className="mu"> {msg}</span>}</div>
}
