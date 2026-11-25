import Link from 'next/link'
import { sb, egp } from '@/lib/server'
import { Rpc } from './Actions'
const ST: any = { pending: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
export async function ClaimsList({ role, status = 'pending' }: any) {
  const s = await sb()
  const { data } = await s.from('view_claims').select('*,submissions(content_url,paid_views,campaigns(title,advertiser_id))').eq('status', status).order('created_at', { ascending: false }).limit(40)
  const urls: any = {}; const own: any = {}; for (const c of data || []) { const { data: vs } = await s.rpc('creator_verified_socials', { p_creator: c.creator_id }); own[c.id] = vs || [] }
  for (const c of data || []) { const { data: u } = await s.storage.from('view-proofs').createSignedUrl(c.proof_path, 300); urls[c.id] = u?.signedUrl }
  return <>{!data?.length && <div className="card mu">لا توجد طلبات.</div>}{data?.map((c: any) => <div className="card" key={c.id}>
    <div className="row"><b>{c.submissions?.campaigns?.title}</b><span className="badge">{ST[c.status]}</span></div>
    <p>المشاهدات المطلوبة: <b>{Number(c.claimed_views).toLocaleString('ar-EG')}</b> <span className="mu">(المحتسب سابقًا {Number(c.submissions?.paid_views || 0).toLocaleString('ar-EG')})</span></p>
    <p className="mu">{own[c.id]?.length ? <>✓ حسابات موثّقة للمبدع: {own[c.id].map((a: any) => a.platform + ' @' + a.username).join(' · ')}</> : '⚠️ المبدع ليس لديه حساب موثّق الملكية، تأكد من اسم الحساب في صورة الإحصائيات.'}</p>
    <p className="row"><a className="btn o" href={c.submissions?.content_url} target="_blank" rel="noopener noreferrer">فتح الفيديو</a>{urls[c.id] && <a className="btn o" href={urls[c.id]} target="_blank" rel="noopener noreferrer">صورة الإحصائيات</a>}</p>
    {c.advertiser_check && <p className="mu">رأي المعلن: <b>{c.advertiser_check === 'confirmed' ? (c.status === 'approved' ? 'اعتمد وصُرف المستحق ✓' : 'يؤكد الرقم ✓') : 'يعترض ✗'}</b> {c.advertiser_note}</p>}
    {c.status === 'pending' && role === 'advertiser' && <div className="row"><Rpc fn="advertiser_review_claim" args={{ p_id: c.id, p_decision: 'approved', p_note: null }} label="اعتماد وصرف المستحق" ask="هل قارنت الرقم بالمشاهدات الظاهرة على الفيديو؟ سيُصرف المستحق للمبدع من ميزانية حملتك." /><Rpc danger fn="advertiser_review_claim" args={{ p_id: c.id, p_decision: 'rejected', p_note: 'الرقم لا يطابق الظاهر على الفيديو' }} label="رفض" ask="رفض الطلب؟" /></div>}
    {c.status === 'pending' && role === 'admin' && <div className="row"><Rpc fn="admin_review_claim" args={{ p_id: c.id, p_decision: 'approved', p_note: null }} label="اعتماد المشاهدات" ask="هل قارنت الرقم بالفيديو وصورة الإحصائيات؟" /><Rpc danger fn="admin_review_claim" args={{ p_id: c.id, p_decision: 'rejected', p_note: 'لم يتم التحقق من الرقم' }} label="رفض" ask="رفض الطلب؟" /></div>}</div>)}</>
}
export async function Queues({ part }: any) {
  const s = await sb()
  if (part === 'review') {
    const [c, sb2] = await Promise.all([s.from('campaigns').select('*').eq('status', 'pending'), s.from('submissions').select('id,content_url,paid_views').eq('status', 'approved').order('submitted_at', { ascending: false }).limit(30)])
    return <><h3>حملات بانتظار الاعتماد</h3>{!c.data?.length && <p className="mu">لا يوجد.</p>}
      {c.data?.map((x: any) => <div className="card row" key={x.id}><span><Link href={`/admin/campaigns/${x.id}`}><b>{x.title}</b></Link> · المموَّل للمبدعين {egp(x.funded_amount)} (بعد العمولة) من ميزانية {egp(x.budget)}<br /><span className="mu">اضغط الاسم لعرض الصورة والتفاصيل والخامات قبل الاعتماد</span></span><span><Rpc fn="admin_review_campaign" args={{ p_id: x.id, p_decision: 'active', p_reason: null }} label="اعتماد" /> <Rpc danger fn="admin_review_campaign" args={{ p_id: x.id, p_decision: 'rejected', p_reason: 'لا تستوفي الشروط' }} label="رفض" ask="رفض الحملة؟" /></span></div>)}
      <h3>تسليمات مقبولة — صرف المستحق</h3><p className="mu">الصرف يعتمد على المشاهدات الموثّقة فقط. لو الرد "لا يوجد مبلغ مستحق" فاعتمد طلب مشاهدات أولًا.</p>{!sb2.data?.length && <p className="mu">لا يوجد.</p>}
      {sb2.data?.map((x: any) => <div className="card row" key={x.id}><a href={x.content_url} target="_blank" rel="noopener noreferrer" className="mu">{x.content_url}</a><Rpc fn="admin_pay_submission" args={{ p_sub: x.id }} label="صرف المستحق" ask="صرف أرباح هذا التسليم حسب المشاهدات الموثّقة؟" /></div>)}</>
  }
  const [p, w, tx] = await Promise.all([s.from('payment_requests').select('*').eq('status', 'pending'), s.from('withdrawal_requests').select('*').eq('status', 'pending'), s.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(30)])
  const signed: any = {}; for (const r of p.data || []) { const { data } = await s.storage.from('payment-proofs').createSignedUrl(r.proof_path, 300); signed[r.id] = data?.signedUrl }
  return <><h3>طلبات الشحن</h3>{!p.data?.length && <p className="mu">لا يوجد.</p>}
    {p.data?.map((x: any) => <div className="card" key={x.id}><div className="row"><span>{egp(x.amount)} · {x.method} · {x.sender_name} · مرجع {x.transaction_ref}</span>{signed[x.id] && <a className="btn o" href={signed[x.id]} target="_blank" rel="noopener noreferrer">عرض الإثبات</a>}</div>
      <Rpc fn="admin_review_payment" args={{ p_id: x.id, p_decision: 'approved', p_approved_amount: null, p_note: null }} label="اعتماد المبلغ المطلوب" ask="تأكد أنك راجعت الإثبات وأن المبلغ وصل فعلًا. اعتماد؟" /> <Rpc danger fn="admin_review_payment" args={{ p_id: x.id, p_decision: 'rejected', p_approved_amount: null, p_note: 'تعذر التحقق من التحويل' }} label="رفض" ask="رفض الدفع؟" /></div>)}
    <h3>طلبات السحب</h3>{!w.data?.length && <p className="mu">لا يوجد.</p>}
    {w.data?.map((x: any) => <div className="card row" key={x.id}><span>إجمالي {egp(x.amount)} · الصافي للتحويل <b>{egp(x.payment_details?.net ?? x.amount)}</b> · {x.payment_method}<br /><span className="mu">{x.payment_details?.name}</span></span><Link className="btn s" href={`/admin/withdrawals/${x.id}`}>مراجعة التفاصيل والتحويل</Link></div>)}
    <h3>آخر العمليات المالية</h3>{tx.data?.map((t: any) => <div className="card row" key={t.id}><span>{t.description || t.transaction_type}<br /><span className="mu">{new Date(t.created_at).toLocaleString('ar-EG')}</span></span><b>{egp(t.amount)}</b></div>)}</>
}
