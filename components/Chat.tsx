'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/client'
const sbc = createClient()
const R: any = { advertiser: 'معلن', admin: 'الإدارة' }
export default function Chat({ cid, uid }: any) {
  const [msgs, setMsgs] = useState<any[]>([]); const [t, setT] = useState(''); const [err, setErr] = useState(''); const end = useRef<HTMLDivElement>(null)
  const load = useCallback(async () => {
    const { data, error } = await sbc.rpc('get_community_messages', { p_community: cid, p_limit: 100 })
    if (error) return setErr(error.message); setErr(''); setMsgs((data || []).slice().reverse()) }, [cid])
  useEffect(() => { load()
    const ch = sbc.channel('c-' + cid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: 'community_id=eq.' + cid }, () => load()).subscribe()
    const iv = setInterval(load, 10000); return () => { sbc.removeChannel(ch); clearInterval(iv) } }, [cid, load])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length])
  async function send() { const m = t.trim(); if (!m) return; setT('')
    const { error } = await sbc.from('community_messages').insert({ community_id: cid, user_id: uid, message: m })
    if (error) { setErr(error.message); setT(m) } else load() }
  return <div><div className="chat">{!msgs.length && !err && <p className="mu" style={{ margin: 'auto' }}>ابدأ المحادثة بأول رسالة 👋</p>}
    {msgs.map(m => <div key={m.id} className={'msg ' + (m.user_id === uid ? 'me' : '')}>
      {m.user_id !== uid && <small><b>{m.sender_name}</b>{R[m.sender_role] && <span className="badge" style={{ marginInlineStart: 6 }}>{R[m.sender_role]}</span>}</small>}
      {m.message}<small>{new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</small></div>)}<div ref={end} /></div>
    {err && <p role="alert" style={{ color: '#ff7b9c' }}>{err}</p>}
    <div className="row" style={{ flexWrap: 'nowrap', marginTop: 8 }}><input style={{ margin: 0 }} value={t} maxLength={1000} placeholder="اكتب رسالة..." onChange={e => setT(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
      <button className="btn" onClick={send}>إرسال</button></div></div>
}
