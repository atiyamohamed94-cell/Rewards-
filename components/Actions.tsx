'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/client'
const sbc = createClient()
function useRun() {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const run = async (f: () => PromiseLike<any>, ok = 'تم بنجاح') => {
    setBusy(true); setMsg(''); const { error } = await f(); setBusy(false)
    if (error) setMsg(error.code === '23505' ? 'تم هذا الإجراء من قبل' : error.message); else { setMsg(ok); r.refresh() } }
  return { busy, msg, run }
}
const Msg = ({ m }: any) => m ? <div className="mu" role="status">{m}</div> : null
export function Rpc({ fn, args, label, danger, ask }: any) {
  const { busy, msg, run } = useRun()
  return <span><button className={'btn s ' + (danger ? 'no' : '')} disabled={busy}
    onClick={() => { if (ask && !confirm(ask)) return; run(() => sbc.rpc(fn, args)) }}>{label}</button><Msg m={msg} /></span>
}
export function SignOut() { const r = useRouter(); return <button className="btn o" onClick={async () => { await sbc.auth.signOut(); r.push('/login'); r.refresh() }}>خروج</button> }
export function Apply({ id }: any) {
  const { busy, msg, run } = useRun(); const [m, setM] = useState('')
  return <div><input placeholder="رسالة للمعلن (اختياري)" value={m} onChange={e => setM(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => run(() => sbc.rpc('apply_to_campaign', { p_campaign: id, p_message: m }), 'تم إرسال طلبك')}>قدّم على الحملة</button><Msg m={msg} /></div>
}
export function SubmitContent({ apps }: any) {
  const { busy, msg, run } = useRun(); const [a, setA] = useState(apps[0]?.id || ''); const [u, setU] = useState(''); const [c, setC] = useState('')
  const url = z.string().url().regex(/(tiktok\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com)/i)
  if (!apps.length) return <p className="mu">لا توجد حملات مقبولة بعد.</p>
  return <div className="card"><h3>تسليم محتوى</h3><label>الحملة</label>
    <select value={a} onChange={e => setA(e.target.value)}>{apps.map((x: any) => <option key={x.id} value={x.id}>{x.campaigns?.title}</option>)}</select>
    <label>رابط الفيديو المنشور</label><input value={u} onChange={e => setU(e.target.value)} placeholder="https://..." />
    <label>ملاحظات</label><textarea value={c} onChange={e => setC(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => {
      if (!url.safeParse(u).success) return alert('رابط غير صالح، استخدم رابط TikTok أو Instagram أو YouTube')
      const ap = apps.find((x: any) => x.id === a)
      run(() => sbc.from('submissions').insert({ campaign_id: ap.campaign_id, application_id: a, creator_id: ap.creator_id, content_url: u, caption: c, status: 'pending' }), 'تم الإرسال للمراجعة') }}>إرسال</button><Msg m={msg} /></div>
}
export function Withdraw() {
  const { busy, msg, run } = useRun(); const [amt, setAmt] = useState(''); const [m, setM] = useState('instapay'); const [d, setD] = useState(''); const [n, setN] = useState('')
  return <div className="card"><h3>طلب سحب</h3><label>المبلغ (الحد الأدنى 50 ج.م)</label><input type="number" value={amt} onChange={e => setAmt(e.target.value)} />{+amt > 0 && <p className="mu">رسوم السحب 5%: {(+amt * 0.05).toFixed(2)} ج.م · الصافي لك: {(+amt * 0.95).toFixed(2)} ج.م</p>}
    <label>الطريقة</label><select value={m} onChange={e => setM(e.target.value)}><option value="instapay">InstaPay</option><option value="ewallet">محفظة إلكترونية</option></select>
    <label>{m === 'instapay' ? 'عنوان InstaPay' : 'رقم المحفظة'}</label><input value={d} onChange={e => setD(e.target.value)} />
    <label>اسم صاحب الحساب</label><input value={n} onChange={e => setN(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (+amt < 50 || !d || !n) return alert('أكمل البيانات (الحد الأدنى 50 ج.م)')
      run(() => sbc.rpc('request_withdrawal', { p_amount: +amt, p_method: m, p_details: { account: d, name: n } }), 'تم إرسال الطلب') }}>إرسال الطلب</button><Msg m={msg} /></div>
}
const camp = z.object({ title: z.string().min(3), brand_name: z.string().min(2), description: z.string().min(10), campaign_type: z.enum(['clipping', 'ugc', 'influencer', 'posting']),
  compensation_type: z.enum(['fixed', 'cpm', 'hybrid']), budget: z.number().positive(), fixed_reward: z.number().min(0), cpm_rate: z.number().min(0), creators_needed: z.number().int().min(1) })
export function CampaignForm({ uid }: any) {
  const { busy, msg, run } = useRun(); const [f, setF] = useState<any>({ campaign_type: 'clipping', compensation_type: 'cpm', creators_needed: 1, fixed_reward: 0, cpm_rate: 0 }); const [pl, setPl] = useState('tiktok')
  const set = (k: string, num = false) => (e: any) => setF({ ...f, [k]: num ? +e.target.value : e.target.value })
  return <div className="card"><h3>حملة جديدة</h3>
    <label>العنوان</label><input onChange={set('title')} /><label>اسم البراند</label><input onChange={set('brand_name')} />
    <label>الوصف</label><textarea onChange={set('description')} />
    <div className="grid"><div><label>النوع</label><select onChange={set('campaign_type')}>{['clipping', 'ugc', 'influencer', 'posting'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label>نوع المكافأة</label><select defaultValue="cpm" onChange={set('compensation_type')}>{['fixed', 'cpm', 'hybrid'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label>المنصة</label><select onChange={e => setPl(e.target.value)}>{['tiktok', 'instagram', 'youtube'].map(x => <option key={x}>{x}</option>)}</select></div></div>
    <div className="grid"><div><label>الميزانية (ج.م)</label><input type="number" onChange={set('budget', true)} /></div>
      <div><label>سعر الألف مشاهدة</label><input type="number" onChange={set('cpm_rate', true)} /></div>
      <div><label>مكافأة ثابتة</label><input type="number" onChange={set('fixed_reward', true)} /></div>
      <div><label>عدد المبدعين</label><input type="number" defaultValue={1} onChange={set('creators_needed', true)} /></div></div>
    <button className="btn" disabled={busy} onClick={() => { const p = camp.safeParse(f); if (!p.success) return alert('تحقق من الحقول: ' + p.error.issues[0].path.join('.'))
      run(() => sbc.from('campaigns').insert({ ...p.data, platforms: [pl], advertiser_id: uid, status: 'draft' }), 'تم حفظ المسودة') }}>حفظ كمسودة</button><Msg m={msg} /></div>
}
export function Fund({ id }: any) {
  const { busy, msg, run } = useRun(); const [a, setA] = useState('')
  return <span><input style={{ width: 110 }} type="number" placeholder="مبلغ (عمولة 15%)" value={a} onChange={e => setA(e.target.value)} />
    <button className="btn s" disabled={busy} onClick={() => run(() => sbc.rpc('fund_campaign', { p_campaign: id, p_amount: +a }), 'تم التمويل')}>تمويل</button><Msg m={msg} /></span>
}
export function SubmitReview({ id }: any) {
  const { busy, msg, run } = useRun()
  return <span><button className="btn o" disabled={busy} onClick={() => run(() => sbc.from('campaigns').update({ status: 'pending' }).eq('id', id), 'أُرسلت للمراجعة')}>إرسال للاعتماد</button><Msg m={msg} /></span>
}
export function TopUp({ uid, methods }: any) {
  const { busy, msg, run } = useRun(); const [f, setF] = useState<any>({ method: methods[0] }); const [file, setFile] = useState<File | null>(null)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return <div className="card"><h3>طلب شحن رصيد</h3><label>المبلغ</label><input type="number" onChange={set('amount')} />
    <label>طريقة الدفع</label><select onChange={set('method')}>{methods.map((x: string) => <option key={x}>{x}</option>)}</select>
    <label>اسم المرسل</label><input onChange={set('sender')} /><label>رقم العملية</label><input onChange={set('ref')} />
    <label>إثبات التحويل (صورة)</label><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
    <button className="btn" disabled={busy} onClick={() => run(async () => {
      if (!file || !f.amount || !f.sender || !f.ref) return { error: { message: 'أكمل كل الحقول وأرفق الإثبات' } }
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`
      const up = await sbc.storage.from('payment-proofs').upload(path, file); if (up.error) return up
      return sbc.from('payment_requests').insert({ user_id: uid, purpose: 'wallet_topup', amount: +f.amount, method: f.method, sender_name: f.sender, transaction_ref: f.ref, proof_path: path, status: 'pending' }) }, 'تم إرسال الطلب للمراجعة')}>إرسال</button><Msg m={msg} /></div>
}
export function MarkRead({ id }: any) { const { busy, run } = useRun(); return <button className="btn o" disabled={busy} onClick={() => run(() => sbc.from('notifications').update({ is_read: true }).eq('id', id))}>تم</button> }
export function ProfileForm({ p, kind, x }: any) {
  const { busy, msg, run } = useRun(); const [f, setF] = useState<any>({ ...p, ...x }); const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const [a, b] = kind === 'advertiser' ? ['advertiser_profiles', { business_name: f.business_name, business_type: f.business_type, website: f.website }] : ['creator_profiles', { display_name: f.display_name, experience: f.experience }]
  return <div className="card"><h3>بياناتي</h3><label>الاسم</label><input defaultValue={f.full_name} onChange={set('full_name')} /><label>الهاتف</label><input defaultValue={f.phone} onChange={set('phone')} />
    <label>نبذة</label><textarea defaultValue={f.bio} onChange={set('bio')} />
    {kind === 'advertiser' ? <><label>اسم النشاط</label><input defaultValue={f.business_name} onChange={set('business_name')} /><label>الموقع</label><input defaultValue={f.website} onChange={set('website')} /></>
      : <><label>الاسم المعروض</label><input defaultValue={f.display_name} onChange={set('display_name')} /><label>الخبرة</label><textarea defaultValue={f.experience} onChange={set('experience')} /></>}
    <button className="btn" disabled={busy} onClick={() => run(async () => { const r = await sbc.from('profiles').update({ full_name: f.full_name, phone: f.phone, bio: f.bio }).eq('id', p.id); if (r.error) return r; return sbc.from(a).update(b).eq('user_id', p.id) }, 'تم الحفظ')}>حفظ</button><Msg m={msg} /></div>
}
export function Avatar({ uid }: any) {
  const { busy, msg, run } = useRun()
  return <div className="card"><h3>الصورة الشخصية</h3><input type="file" accept="image/*" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (!f) return
    if (f.size > 2e6) return alert('الحد الأقصى 2MB'); run(async () => { const path = `${uid}/avatar`; const u = await sbc.storage.from('avatars').upload(path, f, { upsert: true }); if (u.error) return u
      return sbc.from('profiles').update({ avatar_url: sbc.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?t=' + Date.now() }).eq('id', uid) }, 'تم الرفع') }} /><Msg m={msg} /></div>
}
export function Socials({ uid }: any) {
  const { busy, msg, run } = useRun(); const [pl, setPl] = useState('tiktok'); const [un, setUn] = useState(''); const [url, setUrl] = useState('')
  return <div className="card"><h3>إضافة حساب</h3><select value={pl} onChange={e => setPl(e.target.value)}>{['tiktok', 'instagram', 'youtube', 'facebook'].map(x => <option key={x}>{x}</option>)}</select>
    <input placeholder="اسم المستخدم" value={un} onChange={e => setUn(e.target.value)} /><input placeholder="رابط الحساب" value={url} onChange={e => setUrl(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (!un.trim()) return alert('أدخل اسم المستخدم'); run(() => sbc.from('social_accounts').insert({ user_id: uid, platform: pl, username: un.trim(), profile_url: url || null }), 'تمت الإضافة') }}>إضافة</button><Msg m={msg} /></div>
}
export function Del({ table, id, ask }: any) { const { busy, run } = useRun(); return <button className="btn no" disabled={busy} onClick={() => { if (confirm(ask || 'تأكيد الحذف؟')) run(() => sbc.from(table).delete().eq('id', id)) }}>حذف</button> }
export function JoinBtn({ cid, uid }: any) { const { busy, msg, run } = useRun(); return <span><button className="btn o" disabled={busy} onClick={() => run(() => sbc.from('community_members').insert({ community_id: cid, user_id: uid }), 'تم الانضمام')}>انضمام</button><Msg m={msg} /></span> }
export function ChatForm({ cid, uid }: any) {
  const { busy, msg, run } = useRun(); const [t, setT] = useState('')
  return <div><input value={t} maxLength={1000} placeholder="اكتب رسالة" onChange={e => setT(e.target.value)} /><button className="btn" disabled={busy} onClick={() => { if (!t.trim()) return; run(() => sbc.from('community_messages').insert({ community_id: cid, user_id: uid, message: t.trim() }).then((r: any) => { if (!r.error) setT(''); return r })) }}>إرسال</button><Msg m={msg} /></div>
}
export function StatusBtn({ id, to }: any) {
  const { busy, run } = useRun()
  return <button className={'btn ' + (to === 'suspended' ? 'no' : 'o')} disabled={busy} onClick={() => { if (!confirm(to === 'suspended' ? 'إيقاف هذا الحساب؟' : 'إعادة تفعيل الحساب؟')) return
    run(async () => { const r = await sbc.from('profiles').update({ status: to }).eq('id', id); if (r.error) return r; return sbc.from('admin_logs').insert({ action: 'user_' + to, target_type: 'profile', target_id: id }) }) }}>{to === 'suspended' ? 'إيقاف' : 'تفعيل'}</button>
}
export function ViewForm({ subs }: any) {
  const { busy, msg, run } = useRun(); const [s, setS] = useState(subs[0]?.id || ''); const [v, setV] = useState(''); const [ev, setEv] = useState('')
  if (!subs.length) return <p className="mu">لا توجد تسليمات مقبولة.</p>
  return <div className="card"><h3>إدخال مشاهدات موثّقة</h3><select value={s} onChange={e => setS(e.target.value)}>{subs.map((x: any) => <option key={x.id} value={x.id}>{x.content_url}</option>)}</select>
    <label>عدد المشاهدات (من لقطة الشاشة أو الأداة)</label><input type="number" value={v} onChange={e => setV(e.target.value)} /><label>رابط الدليل (اختياري)</label><input value={ev} onChange={e => setEv(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (!(+v >= 0) || v === '') return alert('أدخل عددًا صحيحًا'); if (!confirm('اعتماد هذه المشاهدات كموثّقة؟')) return
      run(() => sbc.from('view_snapshots').insert({ submission_id: s, views: Math.floor(+v), verified: true, source: 'manual', evidence_url: ev || null }), 'تم الحفظ') }}>حفظ كموثّق</button><Msg m={msg} /></div>
}
export function FaqForm() {
  const { busy, msg, run } = useRun(); const [q, setQ] = useState(''); const [a, setA] = useState('')
  return <div className="card"><h3>سؤال جديد</h3><input placeholder="السؤال" value={q} onChange={e => setQ(e.target.value)} /><textarea placeholder="الإجابة" value={a} onChange={e => setA(e.target.value)} />
    <button className="btn" disabled={busy} onClick={() => { if (!q || !a) return alert('أكمل الحقول'); run(() => sbc.from('faqs').insert({ question: q, answer: a, is_published: true, sort_order: 0 }), 'تم النشر') }}>نشر</button><Msg m={msg} /></div>
}
