import { sb } from '@/lib/server'
import { Del } from './Actions'
import { VerifySocial } from './FeatClient'
export default async function SocialList({ uid }: any) {
  const s = await sb(); const [{ data: so }, { data: vs }] = await Promise.all([s.from('social_accounts').select('*').eq('user_id', uid), s.from('social_verifications').select('*').eq('user_id', uid)])
  const v: any = Object.fromEntries((vs || []).map((x: any) => [x.social_account_id, x]))
  return <>{!so?.length && <p className="mu">لم تضف حسابات.</p>}{so?.map((a: any) => { const st = v[a.id]?.status
    return <div className="card" key={a.id}><div className="row"><span>{a.platform} · {a.username} {st === 'verified' ? <span className="badge" style={{ background: '#12372c', color: 'var(--ok)' }}>موثّق ✓</span> : st === 'pending' ? <span className="badge">بانتظار المراجعة</span> : st === 'rejected' ? <span className="badge" style={{ color: '#ff7b9c' }}>مرفوض</span> : null}</span><Del table="social_accounts" id={a.id} /></div>
      {st === 'pending' && <p className="mu">كود التوثيق: <b dir="ltr" style={{ userSelect: 'all' }}>{v[a.id].code}</b> (ضعه في وصف حسابك)</p>}{st === 'rejected' && v[a.id].admin_note && <p className="mu">{v[a.id].admin_note}</p>}
      {st !== 'verified' && st !== 'pending' && <VerifySocial id={a.id} />}</div> })}</>
}
