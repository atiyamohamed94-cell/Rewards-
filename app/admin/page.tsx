import { sb, egp } from '@/lib/server'
import { Rpc } from '@/components/Actions'
export default async function P() {
  const s = await sb()
  const [c, p, w, sb2, u] = await Promise.all([
    s.from('campaigns').select('*').eq('status', 'pending'), s.from('payment_requests').select('*').eq('status', 'pending'),
    s.from('withdrawal_requests').select('*').eq('status', 'pending'), s.from('submissions').select('id,content_url,campaign_id').eq('status', 'approved'),
    s.from('profiles').select('role') ])
  const signed: any = {}; for (const r of p.data || []) { const { data } = await s.storage.from('payment-proofs').createSignedUrl(r.proof_path, 300); signed[r.id] = data?.signedUrl }
  const n = (r: string) => (u.data || []).filter((x: any) => x.role === r).length
  return <><h2>لوحة الإدارة</h2><div className="grid"><div className="card"><div className="mu">المبدعون</div><div className="kpi">{n('creator')}</div></div><div className="card"><div className="mu">المعلنون</div><div className="kpi">{n('advertiser')}</div></div>
    <div className="card"><div className="mu">دفعات معلّقة</div><div className="kpi">{p.data?.length || 0}</div></div><div className="card"><div className="mu">سحوبات معلّقة</div><div className="kpi">{w.data?.length || 0}</div></div></div>
    <h3>حملات بانتظار الاعتماد</h3>{!c.data?.length && <p className="mu">لا يوجد.</p>}
    {c.data?.map((x: any) => <div className="card row" key={x.id}><span>{x.title} · ممول {egp(x.funded_amount)}</span><span><Rpc fn="admin_review_campaign" args={{ p_id: x.id, p_decision: 'active', p_reason: null }} label="اعتماد" /> <Rpc danger fn="admin_review_campaign" args={{ p_id: x.id, p_decision: 'rejected', p_reason: 'لا تستوفي الشروط' }} label="رفض" ask="رفض الحملة؟" /></span></div>)}
    <h3>طلبات الدفع</h3>{!p.data?.length && <p className="mu">لا يوجد.</p>}
    {p.data?.map((x: any) => <div className="card" key={x.id}><div className="row"><span>{egp(x.amount)} · {x.method} · {x.sender_name} · مرجع {x.transaction_ref}</span>{signed[x.id] && <a className="btn o" href={signed[x.id]} target="_blank" rel="noopener noreferrer">عرض الإثبات</a>}</div>
      <Rpc fn="admin_review_payment" args={{ p_id: x.id, p_decision: 'approved', p_approved_amount: null, p_note: null }} label="اعتماد المبلغ المطلوب" ask="تأكد أنك راجعت الإثبات وأن المبلغ وصل فعلًا. اعتماد؟" /> <Rpc danger fn="admin_review_payment" args={{ p_id: x.id, p_decision: 'rejected', p_approved_amount: null, p_note: 'تعذر التحقق من التحويل' }} label="رفض" ask="رفض الدفع؟" /></div>)}
    <h3>طلبات السحب</h3>{!w.data?.length && <p className="mu">لا يوجد.</p>}
    {w.data?.map((x: any) => <div className="card row" key={x.id}><span>{egp(x.amount)} · {x.payment_method} · {JSON.stringify(x.payment_details)}</span><span><Rpc fn="admin_review_withdrawal" args={{ p_id: x.id, p_decision: 'approved', p_note: null }} label="تم التحويل" ask="هل حوّلت المبلغ فعلًا؟" /> <Rpc danger fn="admin_review_withdrawal" args={{ p_id: x.id, p_decision: 'rejected', p_note: 'تعذر التنفيذ' }} label="رفض وإرجاع" ask="رفض وإرجاع المبلغ للمحفظة؟" /></span></div>)}
    <h3>تسليمات مقبولة جاهزة للصرف</h3>{!sb2.data?.length && <p className="mu">لا يوجد.</p>}
    {sb2.data?.map((x: any) => <div className="card row" key={x.id}><a href={x.content_url} target="_blank" rel="noopener noreferrer" className="mu">{x.content_url}</a><Rpc fn="admin_pay_submission" args={{ p_sub: x.id }} label="صرف المستحق" ask="صرف أرباح هذا التسليم حسب المشاهدات الموثّقة؟" /></div>)}</>
}
