import { sb, egp } from '@/lib/server'
import { TopUp } from '@/components/Actions'
import AdvWithdraw from '@/components/AdvWithdraw'
export default async function P() {
  const s = await sb(); const user = (await s.auth.getSession()).data.session?.user
  const { data: w } = await s.from('wallets').select('*').eq('user_id', user!.id).single()
  const { data: pr } = await s.from('payment_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)
  const { data: wr } = await s.from('withdrawal_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)
  const { data: set } = await s.from('platform_settings').select('key,value').in('key', ['instapay_name', 'instapay_ipa', 'ewallet_number', 'cash_instructions', 'payment_methods'])
  const S: any = Object.fromEntries((set || []).map((x: any) => [x.key, x.value])); const t = (k: string) => typeof S[k] === 'string' ? S[k] : ''
  const methods = Array.isArray(S.payment_methods) && S.payment_methods.every((m: any) => typeof m === 'string') ? S.payment_methods : ['instapay', 'ewallet', 'cash']
  const L: any = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
  const WL: any = { pending: 'قيد المراجعة', approved: 'تم التحويل', rejected: 'مرفوض' }
  return <><h2>المحفظة</h2><div className="card"><div className="mu">الرصيد المتاح</div><div className="kpi g">{egp(w?.available_balance)}</div>{Number(w?.pending_balance) > 0 && <div className="mu">طلبات سحب قيد المراجعة: {egp(w?.pending_balance)}</div>}</div>
    <div className="card"><b>حوّل المبلغ إلى:</b><p className="mu">InstaPay: {t('instapay_ipa')} {t('instapay_name') && `(${t('instapay_name')})`}<br />محفظة إلكترونية: {t('ewallet_number')}<br />{t('cash_instructions')}</p></div>
    <TopUp uid={user!.id} methods={methods} /><h3>طلباتي</h3>{!pr?.length && <p className="mu">لا توجد طلبات.</p>}
    {pr?.map((r: any) => <div className="card row" key={r.id}><span>{egp(r.amount)} · {r.method}</span><span className="badge">{L[r.status]}</span>{r.admin_note && <span className="mu">{r.admin_note}</span>}</div>)}
    <AdvWithdraw available={Number(w?.available_balance || 0)} />
    <h3>طلبات السحب</h3>{!wr?.length && <p className="mu">لا توجد طلبات.</p>}
    {wr?.map((r: any) => <div className="card row" key={r.id}><span>{egp(r.amount)} · {r.payment_method}</span><span className="badge">{WL[r.status] || r.status}</span></div>)}</>
}
