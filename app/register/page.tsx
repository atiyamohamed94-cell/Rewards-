'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/client'
import { TERMS } from '@/lib/legal'
function F() {
  const r = useRouter(); const q = useSearchParams(); const [role, setRole] = useState(q.get('role') === 'advertiser' ? 'advertiser' : 'creator')
  const [f, setF] = useState<any>({}); const [agree, setAgree] = useState(false); const [msg, setMsg] = useState(''); const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  async function go() {
    if (!agree) return setMsg('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية')
    if (!f.email || !f.password || f.password.length < 8 || !f.name) return setMsg('أكمل الحقول (كلمة المرور 8 أحرف على الأقل)')
    const { data, error } = await createClient().auth.signUp({ email: f.email, password: f.password, options: { data: { role, full_name: f.name, business_name: f.biz || '', terms_accepted_at: new Date().toISOString(), terms_version: TERMS.version } } })
    if (error) return setMsg(error.message)
    if (!data.session) return setMsg('تم إنشاء الحساب. أكّد بريدك الإلكتروني ثم سجّل الدخول.')
    r.push(`/${role}/campaigns`); r.refresh() }
  return <div className="wrap" style={{ maxWidth: 420 }}><div className="card"><h2>إنشاء حساب</h2>
    <div className="row"><button className={'btn ' + (role === 'creator' ? '' : 'o')} onClick={() => setRole('creator')}>صانع محتوى</button><button className={'btn ' + (role === 'advertiser' ? '' : 'o')} onClick={() => setRole('advertiser')}>معلن</button></div><br />
    <label>الاسم</label><input onChange={set('name')} />{role === 'advertiser' && <><label>اسم النشاط التجاري</label><input onChange={set('biz')} /></>}
    <label>البريد</label><input type="email" onChange={set('email')} /><label>كلمة المرور</label><input type="password" onChange={set('password')} />
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '12px 0' }}><input type="checkbox" style={{ width: 'auto', marginTop: 4 }} checked={agree} onChange={e => setAgree(e.target.checked)} /><span>أوافق على <Link href="/terms" target="_blank">الشروط والأحكام</Link> و<Link href="/privacy" target="_blank">سياسة الخصوصية</Link></span></label>
    <button className="btn" style={{ width: '100%' }} disabled={!agree} onClick={go}>إنشاء الحساب</button>{msg && <p role="status" className="mu">{msg}</p>}</div></div>
}
export default function Register() { return <Suspense><F /></Suspense> }
