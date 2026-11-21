'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/client'
export default function Login() {
  const r = useRouter(); const [e, setE] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('')
  async function go() { const s = createClient(); const { data, error } = await s.auth.signInWithPassword({ email: e, password: p })
    if (error) return setErr('البريد أو كلمة المرور غير صحيحة')
    const { data: pr } = await s.from('profiles').select('role,status').eq('id', data.user.id).single()
    if (!pr || pr.status !== 'active') { await s.auth.signOut(); return setErr('الحساب غير نشط') }
    r.push(pr.role === 'admin' ? '/admin' : `/${pr.role}/campaigns`); r.refresh() }
  return <div className="wrap" style={{ maxWidth: 420 }}><div className="card"><h2>تسجيل الدخول</h2><label>البريد</label><input type="email" value={e} onChange={x => setE(x.target.value)} />
    <label>كلمة المرور</label><input type="password" value={p} onChange={x => setP(x.target.value)} /><button className="btn" style={{ width: '100%' }} onClick={go}>دخول</button>
    {err && <p role="alert" style={{ color: '#ff7b9c' }}>{err}</p>}<p className="mu">ليس لديك حساب؟ <Link href="/register">إنشاء حساب</Link></p></div></div>
}
