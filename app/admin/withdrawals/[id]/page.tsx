import Link from 'next/link'
import { sb, egp } from '@/lib/server'
import { Rpc } from '@/components/Actions'
export const dynamic = 'force-dynamic'
const SRC: any = { creator_claim_advertiser: 'أكّد المعلن المشاهدات', manual: 'أضافها الأدمن يدويًا' }
const ROLE: any = { creator: 'صانع محتوى', advertiser: 'معلن', admin: 'إدارة' }
const ST: any = { pending: 'بانتظار المراجعة', approved: 'تم التحويل', rejected: 'مرفوض' }
const DOT: any = { red: '🔴', yellow: '🟡', green: '🟢' }
const d = (x: any) => x ? new Date(x).toLocaleString('ar-EG') : '—'
export default async function P({ params }: any) {
  const id = (await params).id; const s = await sb()
  const { data: r, error } = await s.rpc('admin_withdrawal_dossier', { p_id: id })
  if (error || !r) return <div className="card"><p>تعذّر عرض الطلب: {error?.message || 'غير موجود'}</p><Link href="/admin/finance">→ رجوع للمالية</Link></div>
  const q = r.request, u = r.user, t = r.totals
  const red = r.flags.some((f: any) => f.level === 'red')
  const paths = new Set<string>(); const signed: any = {}
  ;(r.earnings || []).forEach((x: any) => { (x.claims || []).forEach((c: any) => c.proof && paths.add(c.proof)); (x.snaps || []).forEach((c: any) => c.evidence && paths.add(c.evidence)) })
  for (const pth of paths) { if (/^https?:/.test(pth)) signed[pth] = pth; else { const { data } = await s.storage.from('view-proofs').createSignedUrl(pth, 600); if (data?.signedUrl) signed[pth] = data.signedUrl } }
  return <><Link href="/admin/finance" className="mu">→ رجوع للمالية</Link>
    <h2>مراجعة طلب سحب</h2>
    <div className="card"><div className="row"><b>{egp(q.amount)} (الصافي للتحويل: {egp(q.net)})</b><span className="badge">{ST[q.status] || q.status}</span></div>
      <p>حوّل إلى: <b>{q.method === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية'}</b> · <span dir="ltr">{q.account}</span> · باسم: <b>{q.holder}</b></p>
      <p className="mu">وقت الطلب: {d(q.created_at)}{q.fee > 0 && ` · رسوم المنصة ${egp(q.fee)}`}</p></div>

    <h3>١) ملخص الأمان</h3>
    <div className="card">{r.flags.map((f: any, i: number) => <p key={i}>{DOT[f.level]} {f.text}</p>)}
      <p className="mu">{red ? 'يوجد تحذير أحمر: لا تحوّل قبل ما تفهم السبب (راجع الأقسام تحت أو اسأل صاحب المنصة).' : 'اقرأ الأقسام تحت قبل التحويل.'}</p></div>

    <h3>٢) من هو صاحب الطلب؟</h3>
    <div className="card"><p><span className="mu">الاسم: </span>{u.name || '—'} · <span className="mu">النوع: </span>{ROLE[u.role] || u.role}</p>
      <p><span className="mu">البريد: </span><span dir="ltr">{u.email}</span> · <span className="mu">الهاتف: </span><span dir="ltr">{u.phone || '—'}</span></p>
      <p><span className="mu">عمر الحساب: </span>{u.age_days} يوم · <span className="mu">حالة الحساب: </span>{u.status}</p>
      <p><span className="mu">حسابات التواصل: </span>{r.social.length ? r.social.map((x: any) => <span key={x.url || x.username}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.platform}: {x.username}</a>{' · '}</span>) : 'لا يوجد'}</p></div>

    <h3>٣) من أين جاءت هذه الفلوس؟</h3>
    {q.is_advertiser ? <>
      <p className="mu">هذا معلن: رصيده يأتي من إيداعات اعتُمدت، أو من رصيد حملات أُغلقت.</p>
      {!r.deposits.length && <p className="mu">لا توجد إيداعات.</p>}
      {r.deposits.map((x: any, i: number) => <div className="card row" key={i}><span>{egp(x.approved_amount ?? x.amount)} · {x.method} · {x.sender_name}<br /><span className="mu">{d(x.ts)}</span></span><span className="badge">{ST[x.status] || x.status}</span></div>)}
    </> : <>
      <div className="grid"><div className="card"><div className="mu">إجمالي أرباحه من الحملات</div><div className="kpi">{egp(t.earned)}</div></div>
        <div className="card"><div className="mu">سُحب سابقًا ({t.withdrawals_before} عملية)</div><div className="kpi">{egp(t.withdrawn_before)}</div></div></div>
      <h3>ممن حصل على الأرباح؟</h3>{!r.by_advertiser.length && <p className="mu">لا يوجد.</p>}
      {r.by_advertiser.map((x: any, i: number) => <div className="card row" key={i}><span>{x.advertiser || '—'} · {x.n} عملية صرف</span><b>{egp(x.total)}</b></div>)}
      <h3>تفاصيل كل عملية ربح (آخر 40)</h3>{!r.earnings.length && <p className="mu">لا توجد أرباح.</p>}
      {r.earnings.map((x: any, i: number) => <div className="card" key={i}><div className="row"><b>{x.campaign || 'حملة غير معروفة'}</b><b>{egp(x.amount)}</b></div>
        <p className="mu">المعلن: {x.advertiser || '—'} · المشاهدات المدفوعة: {Number(x.views || 0).toLocaleString('ar-EG')} · التوثيق: {SRC[x.verified_by] || x.verified_by || 'غير مسجل'}<br />{d(x.ts)}</p>
        {x.content_url && <p><a className="btn o" href={x.content_url} target="_blank" rel="noopener noreferrer">▶ فتح الفيديو</a> <span className="mu" dir="ltr" style={{ wordBreak: 'break-all' }}>{x.content_url}</span></p>}
        {(x.claims || []).map((c: any, j: number) => <div key={j} className="card"><p className="mu">طلب مشاهدات: {Number(c.views).toLocaleString('ar-EG')} · {ST[c.status] || c.status} · {d(c.ts)}</p>
          {c.proof && signed[c.proof] ? <a href={signed[c.proof]} target="_blank" rel="noopener noreferrer"><img src={signed[c.proof]} alt="إثبات المشاهدات" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8 }} /></a> : <p className="mu">⚠️ لا توجد صورة إثبات.</p>}</div>)}
        {(x.snaps || []).filter((c: any) => c.verified).map((c: any, j: number) => <p key={j} className="mu">✓ مشاهدات موثّقة: {Number(c.views).toLocaleString('ar-EG')} ({SRC[c.source] || c.source}){c.evidence && signed[c.evidence] && !(x.claims || []).some((k: any) => k.proof === c.evidence) && <> · <a href={signed[c.evidence]} target="_blank" rel="noopener noreferrer">الإثبات</a></>}</p>)}
        {!(x.claims || []).length && !(x.snaps || []).length && <p className="mu">⚠️ لا يوجد أي إثبات مشاهدات مسجل لهذا الربح.</p>}
        <p className="mu">للتأكد: افتح الفيديو وقارن اسم الحساب وعدد المشاهدات بالصورة.</p></div>)}
    </>}

    <h3>٤) آخر حركات المحفظة</h3>
    {r.wallet_log.map((x: any, i: number) => <div className="card row" key={i}><span>{x.description || x.type}<br /><span className="mu">{d(x.ts)} · {x.status}</span></span><b>{egp(x.amount)}</b></div>)}

    {q.status === 'pending' && <div className="card"><b>القرار</b><p className="mu">حوّل المبلغ الصافي أولًا، وبعدها اضغط «تم التحويل». الرفض يرجّع المبلغ لمحفظته.</p>
      <Rpc fn="admin_review_withdrawal" args={{ p_id: id, p_decision: 'approved', p_note: null }} label="تم التحويل" ask={`هل حوّلت ${q.net} جنيه فعلًا إلى ${q.account}؟`} />{' '}
      <Rpc danger fn="admin_review_withdrawal" args={{ p_id: id, p_decision: 'rejected', p_note: 'تعذر التنفيذ' }} label="رفض وإرجاع" ask="رفض وإرجاع المبلغ للمحفظة؟" /></div>}
  </>
}
