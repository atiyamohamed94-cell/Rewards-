import Link from 'next/link'
import { sb } from '@/lib/server'
import { JoinBtn } from './Actions'
import Chat from './Chat'
export async function GroupsList({ role }: any) {
  const s = await sb(); const { data: { user } } = await s.auth.getUser()
  const { data: cs } = await s.from('communities').select('*').order('is_general', { ascending: false }).order('created_at', { ascending: false })
  const { data: mem } = await s.from('community_members').select('community_id').eq('user_id', user!.id)
  const joined = new Set((mem || []).map((m: any) => m.community_id))
  const { data: ids } = role === 'advertiser' ? await s.from('campaigns').select('id').eq('advertiser_id', user!.id)
    : await s.from('campaign_applications').select('campaign_id').eq('creator_id', user!.id).eq('status', 'accepted')
  const ok = new Set((ids || []).map((x: any) => x.id || x.campaign_id))
  const list = (cs || []).filter((c: any) => c.is_general || joined.has(c.id) || ok.has(c.campaign_id))
  return <><h2>المجتمعات</h2>{!list.length && <div className="card mu">لا توجد مجموعات بعد. تظهر لك مجموعة كل حملة بعد قبولك فيها.</div>}
    {list.map((c: any) => <div className="card row" key={c.id}><span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span className="avatar">{c.is_general ? '🌐' : '🎯'}</span><span><b>{c.name}</b><br /><span className="mu">{c.is_general ? 'المجتمع العام' : 'مجموعة الحملة'}</span></span></span>
      {joined.has(c.id) ? <Link className="btn" href={`/${role}/communities/${c.id}`}>فتح المحادثة</Link> : <JoinBtn cid={c.id} uid={user!.id} />}</div>)}</>
}
export async function GroupChat({ id, role }: any) {
  const s = await sb(); const { data: { user } } = await s.auth.getUser()
  const { data: c } = await s.from('communities').select('*').eq('id', id).maybeSingle()
  const { data: m } = await s.from('community_members').select('id').eq('community_id', id).eq('user_id', user!.id).maybeSingle()
  if (!c) return <div className="card mu">المجموعة غير موجودة.</div>
  return <><div className="row"><h2>{c.is_general ? '🌐' : '🎯'} {c.name}</h2><Link className="btn o" href={`/${role}/communities`}>رجوع</Link></div>
    {m ? <Chat cid={id} uid={user!.id} /> : <div className="card"><p className="mu">انضم للمجموعة لتشارك في المحادثة.</p><JoinBtn cid={id} uid={user!.id} /></div>}</>
}
