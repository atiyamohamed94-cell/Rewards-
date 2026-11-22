import { sb, egp, monthly } from '@/lib/server'
import Bars from './Bars'
import { MarkRead, ProfileForm, Avatar, Socials, Del, JoinBtn, ChatForm } from './Actions'
export async function Notifications() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data } = await s.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)
  const un = (data || []).filter((n: any) => !n.is_read).length
  return <><h2>الإشعارات {un > 0 && <span className="badge">{un} جديد</span>}</h2>{!data?.length && <div className="card mu">لا توجد إشعارات.</div>}
    {data?.map((n: any) => <div className="card row" key={n.id} style={{ opacity: n.is_read ? .6 : 1 }}><span><b>{n.title}</b><br /><span className="mu">{n.message}</span></span>{!n.is_read && <MarkRead id={n.id} />}</div>)}</>
}
export async function Profile({ kind }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: p } = await s.from('profiles').select('*').eq('id', user!.id).single()
  const { data: x } = await s.from(kind === 'advertiser' ? 'advertiser_profiles' : 'creator_profiles').select('*').eq('user_id', user!.id).maybeSingle()
  const { data: so } = await s.from('social_accounts').select('*').eq('user_id', user!.id)
  return <><h2>حسابي</h2>{p?.avatar_url && <img src={p.avatar_url} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />}<p className="mu">{p?.email} · الدور: {p?.role} · التوثيق: {x?.verified ? 'موثّق ✓' : 'غير موثّق'}</p>
    <ProfileForm p={p} x={x || {}} kind={kind} /><Avatar uid={user!.id} />
    <h3>الحسابات الاجتماعية</h3>{!so?.length && <p className="mu">لم تضف حسابات.</p>}{so?.map((a: any) => <div className="card row" key={a.id}><span>{a.platform} · {a.username}</span><Del table="social_accounts" id={a.id} /></div>)}<Socials uid={user!.id} /></>
}
export async function Communities({ sp }: any) {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: cs } = await s.from('communities').select('*'); const { data: mem } = await s.from('community_members').select('community_id').eq('user_id', user!.id)
  const joined = new Set((mem || []).map((m: any) => m.community_id)); const sel = sp?.c
  const { data: msgs } = sel && joined.has(sel) ? await s.from('community_messages').select('*').eq('community_id', sel).order('created_at', { ascending: false }).limit(50) : { data: null }
  return <><h2>المجتمعات</h2>{!cs?.length && <div className="card mu">لا توجد مجتمعات بعد.</div>}
    {cs?.map((c: any) => <div className="card row" key={c.id}><span><b>{c.name}</b><br /><span className="mu">{c.description}</span></span>
      {joined.has(c.id) ? <a className="btn o" href={`?c=${c.id}`}>فتح</a> : <JoinBtn cid={c.id} uid={user!.id} />}</div>)}
    {msgs && <div className="card"><ChatForm cid={sel} uid={user!.id} />{!msgs.length && <p className="mu">لا توجد رسائل.</p>}
      {msgs.map((m: any) => <p key={m.id}><b>{m.user_id === user!.id ? 'أنا' : 'عضو'}:</b> {m.message}</p>)}<p className="mu">حدّث الصفحة لرؤية الرسائل الجديدة.</p></div>}</>
}
export function DateFilter({ sp }: any) { return <form className="card row"><label>من <input type="date" name="from" defaultValue={sp?.from} /></label><label>إلى <input type="date" name="to" defaultValue={sp?.to} /></label><button className="btn">تطبيق</button></form> }
export async function Analytics({ role, sp }: any) {
  const D = (q: any, col: string) => { if (sp?.from) q = q.gte(col, sp.from); if (sp?.to) q = q.lte(col, sp.to + 'T23:59:59'); return q }
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  if (role === 'creator') {
    const { data: tx } = await D(s.from('wallet_transactions').select('amount,created_at').eq('user_id', user!.id).eq('transaction_type', 'earning'), 'created_at')
    const { data: sub } = await D(s.from('submissions').select('paid_views,status').eq('creator_id', user!.id), 'submitted_at')
    return <><h2>تحليلاتي</h2><DateFilter sp={sp} /><div className="grid"><div className="card"><div className="mu">إجمالي المشاهدات المحتسبة</div><div className="kpi">{(sub || []).reduce((a: number, x: any) => a + Number(x.paid_views), 0).toLocaleString('ar-EG')}</div></div>
      <div className="card"><div className="mu">التسليمات المقبولة</div><div className="kpi">{(sub || []).filter((x: any) => x.status === 'approved').length}</div></div></div><Bars title="الأرباح شهريًا (ج.م)" data={monthly(tx || [], 'created_at', 'amount')} /></>
  }
  if (role === 'advertiser') {
    const { data: cs } = await D(s.from('campaigns').select('title,funded_amount,spent_amount,created_at').eq('advertiser_id', user!.id), 'created_at')
    const { data: sub } = await D(s.from('submissions').select('paid_views,creator_id'), 'submitted_at')
    return <><h2>تحليلات الحملات</h2><DateFilter sp={sp} /><div className="grid"><div className="card"><div className="mu">إجمالي المصروف</div><div className="kpi">{egp((cs || []).reduce((a: number, c: any) => a + Number(c.spent_amount), 0))}</div></div>
      <div className="card"><div className="mu">المشاهدات المحتسبة</div><div className="kpi">{(sub || []).reduce((a: number, x: any) => a + Number(x.paid_views), 0).toLocaleString('ar-EG')}</div></div>
      <div className="card"><div className="mu">المبدعون المشاركون</div><div className="kpi">{new Set((sub || []).map((x: any) => x.creator_id)).size}</div></div></div>
      <Bars title="الإنفاق لكل حملة (ج.م)" data={(cs || []).map((c: any) => [c.title.slice(0, 8), Number(c.spent_amount)] as [string, number])} /></>
  }
  const { data: pr } = await D(s.from('profiles').select('created_at'), 'created_at'); const { data: cs } = await D(s.from('campaigns').select('created_at,funded_amount,spent_amount'), 'created_at')
  return <><h2>تحليلات المنصة</h2><DateFilter sp={sp} /><div className="grid"><div className="card"><div className="mu">إجمالي التمويل</div><div className="kpi">{egp((cs || []).reduce((a: number, c: any) => a + Number(c.funded_amount), 0))}</div></div>
    <div className="card"><div className="mu">إجمالي المصروف للمبدعين</div><div className="kpi">{egp((cs || []).reduce((a: number, c: any) => a + Number(c.spent_amount), 0))}</div></div></div>
    <Bars title="نمو المستخدمين" data={monthly(pr || [], 'created_at')} /><Bars title="نمو الحملات" data={monthly(cs || [], 'created_at')} /></>
}
