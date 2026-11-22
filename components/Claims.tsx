'use client'
import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRun } from './Forms'
const sbc = createClient()
export function ClaimForm({ subs, uid }: any) {
  const { busy, msg, run } = useRun(); const [s, setS] = useState(subs[0]?.id || ''); const [v, setV] = useState(''); const [n, setN] = useState(''); const [f, setF] = useState<File | null>(null)
  if (!subs.length) return null
  return <div className="card"><h3>طلب اعتماد مشاهدات</h3><p className="mu">أدخل عدد المشاهدات الحالي وأرفق لقطة شاشة من إحصائيات حسابك. يراجعها صاحب الحملة ثم الإدارة.</p>
    <select value={s} onChange={e => setS(e.target.value)}>{subs.map((x: any) => <option key={x.id} value={x.id}>{x.campaigns?.title} · {x.content_url.slice(0, 30)}</option>)}</select>
    <input type="number" placeholder="عدد المشاهدات" value={v} onChange={e => setV(e.target.value)} /><input placeholder="ملاحظات (اختياري)" value={n} onChange={e => setN(e.target.value)} />
    <label>لقطة الإحصائيات (صورة، حتى 5MB)</label><input type="file" accept="image/*" onChange={e => setF(e.target.files?.[0] || null)} />
    <button className="btn" disabled={busy} onClick={() => run(async () => {
      if (!f || f.size > 5e6 || !(+v > 0)) return { error: { message: 'أدخل العدد وأرفق صورة أقل من 5MB' } }
      const path = `${uid}/${Date.now()}-${f.name.replace(/[^\w.]/g, '_')}`; const up = await sbc.storage.from('view-proofs').upload(path, f); if (up.error) return up
      return sbc.rpc('submit_view_claim', { p_sub: s, p_views: Math.floor(+v), p_proof: path, p_note: n }) }, 'تم إرسال الطلب للمراجعة')}>إرسال</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function ClaimReview({ id, mode }: any) {
  const { busy, msg, run } = useRun(); const [n, setN] = useState(''); const adm = mode === 'admin'; const fn = adm ? 'admin_finalize_view_claim' : 'review_view_claim'
  const go = (d: string, ask: string) => { if (confirm(ask)) run(() => sbc.rpc(fn, { p_claim: id, p_decision: d, p_note: n || null })) }
  return <div><input placeholder="ملاحظة (مطلوبة عند الرفض)" value={n} onChange={e => setN(e.target.value)} /><div className="row">
    <button className="btn" disabled={busy} onClick={() => go('approved', adm ? 'اعتماد هذه المشاهدات كموثّقة؟' : 'الموافقة على الرقم؟')}>{adm ? 'اعتماد' : 'موافقة'}</button>
    <button className="btn no" disabled={busy} onClick={() => { if (!n.trim()) return alert('اكتب سبب الرفض'); go('rejected', 'رفض الطلب؟') }}>رفض</button>
    {!adm && <button className="btn o" disabled={busy} onClick={() => go('disputed', 'تحويل الطلب للإدارة؟')}>تصعيد للإدارة</button>}</div>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
