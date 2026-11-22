'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
export default function Reset() {
  const r = useRouter(); const [ok, setOk] = useState<boolean | null>(null); const [p, setP] = useState(''); const [p2, setP2] = useState(''); const [m, setM] = useState('')
  useEffect(() => { createClient().auth.getSession().then(({ data }) => setOk(!!data.session)) }, [])
  async function save() { if (p.length < 8) return setM('كلمة المرور 8 أحرف على الأقل'); if (p !== p2) return setM('كلمتا المرور غير متطابقتين')
    const { error } = await createClient().auth.updateUser({ password: p }); if (error) return setM(error.message); r.push('/go'); r.refresh() }
  return <div className="wrap" style={{ maxWidth: 420 }}><div className="card"><h2>كلمة مرور جديدة</h2>
    {ok === false ? <p role="alert" style={{ color: '#ff7b9c' }}>الرابط منتهي أو غير صالح. اطلب رابطًا جديدًا من صفحة "نسيت كلمة المرور".</p> : <>
      <input type="password" placeholder="كلمة المرور الجديدة" value={p} onChange={x => setP(x.target.value)} /><input type="password" placeholder="أعد كتابتها" value={p2} onChange={x => setP2(x.target.value)} />
      <button className="btn" style={{ width: '100%' }} onClick={save}>حفظ</button>{m && <p role="alert" className="mu">{m}</p>}</>}</div></div>
}
