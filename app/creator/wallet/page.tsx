import { sb, egp } from '@/lib/server'
import { Withdraw } from '@/components/Actions'
const W: any = { pending: 'معلّق', approved: 'تم التنفيذ', rejected: 'مرفوض', paid: 'تم الدفع' }
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: w } = await s.from('wallets').select('*').eq('user_id', user!.id).single()
  const { data: tx } = await s.from('wallet_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)
  const { data: wr } = await s.from('withdrawal_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)
  return <><h2>المحفظة</h2><div className="grid"><div className="card"><div className="mu">الرصيد المتاح</div><div className="kpi g">{egp(w?.available_balance)}</div></div>
    <div className="card"><div className="mu">رصيد معلّق (سحب قيد المراجعة)</div><div className="kpi">{egp(w?.pending_balance)}</div></div></div>
    <Withdraw /><h3>طلبات السحب</h3>{!wr?.length && <p className="mu">لا توجد طلبات.</p>}
    {wr?.map((r: any) => <div className="card row" key={r.id}><span>{egp(r.amount)} · {r.payment_method}</span><span className="badge">{W[r.status]}</span></div>)}
    <h3>سجل العمليات</h3>{!tx?.length && <p className="mu">لا توجد عمليات.</p>}
    {tx?.map((t: any) => <div className="card row" key={t.id}><span>{t.description || t.transaction_type}</span><span>{egp(t.amount)}</span></div>)}</>
}
