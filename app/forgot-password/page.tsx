'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/client'
export default function Forgot() {
  const [e, setE] = useState(''); const [m, setM] = useState(''); const [busy, setBusy] = useState(false)
  return <div className="wrap" style={{ maxWidth: 420 }}><div className="card"><h2>استعادة كلمة المرور</h2><p className="mu">اكتب بريدك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.</p>
    <input type="email" value={e} onChange={x => setE(x.target.value)} placeholder="البريد الإلكتروني" />
    <button className="btn" style={{ width: '100%' }} disabled={busy || !e} onClick={async () => { setBusy(true)
      await createClient().auth.resetPasswordForEmail(e.trim(), { redirectTo: location.origin + '/auth/callback?next=/reset-password' }); setBusy(false)
      setM('إن كان البريد مسجّلًا لدينا فسيصلك رابط الاستعادة خلال دقائق. افحص الرسائل غير المرغوبة أيضًا.') }}>إرسال الرابط</button>
    {m && <p role="status" className="mu">{m}</p>}<p className="mu"><Link href="/login">العودة لتسجيل الدخول</Link></p></div></div>
}
