import Link from 'next/link'
import { sb, egp } from '@/lib/server'
export const dynamic = 'force-dynamic'
export default async function P() {
  const s = await sb(); const cnt = async (t: string, f?: (q: any) => any) => { let q = s.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count || 0 }
  const [claims, camps, ready, pay, wd, disp, users] = await Promise.all([cnt('view_claims', q => q.eq('status', 'pending')), cnt('campaigns', q => q.eq('status', 'pending')), cnt('submissions', q => q.eq('status', 'approved')),
    cnt('payment_requests', q => q.eq('status', 'pending')), cnt('withdrawal_requests', q => q.eq('status', 'pending')), cnt('disputes', q => q.eq('status', 'open')), cnt('profiles')])
  const { data: fees } = await s.from('wallet_transactions').select('amount').eq('transaction_type', 'platform_fee').eq('status', 'completed')
  const rev = (fees || []).reduce((a: number, f: any) => a + Number(f.amount), 0)
  const { data: ov } = await s.from('admin_logs').select('*').like('action', 'advertiser_claim_%').order('created_at', { ascending: false }).limit(5)
  const C = ({ n, t, h }: any) => <Link href={h} className="card" style={{ borderColor: n > 0 ? 'var(--o)' : undefined }}><div className="kpi">{n}</div><div className="mu">{t}</div></Link>
  return <><h2>لوحة الإدارة</h2><p className="mu">الأرقام البرتقالية تعني شغلًا ينتظرك. اضغط على أي بطاقة.</p>
    <div className="grid"><C n={claims} t="طلبات توثيق مشاهدات" h="/admin/claims" /><C n={camps} t="حملات بانتظار الاعتماد" h="/admin/review" /><C n={ready} t="تسليمات مقبولة (للصرف)" h="/admin/review" />
      <C n={pay} t="طلبات شحن" h="/admin/finance" /><C n={wd} t="طلبات سحب" h="/admin/finance" /><C n={disp} t="طلبات ونزاعات مفتوحة" h="/admin/disputes" /></div>
    <div className="grid"><div className="card"><div className="mu">إيرادات المنصة (العمولات)</div><div className="kpi g">{egp(rev)}</div></div><Link href="/admin/users" className="card"><div className="kpi">{users}</div><div className="mu">إجمالي المستخدمين</div></Link></div>
    <h3>رقابة: آخر قرارات المعلنين على المشاهدات</h3>{!ov?.length ? <p className="mu">لا يوجد.</p> : ov.map((l: any) => <div className="card row" key={l.id}><span>{l.action === 'advertiser_claim_approved' ? 'اعتماد' : 'رفض'} · {Number(l.details?.views || 0).toLocaleString('ar-EG')} مشاهدة</span><span>{egp(l.details?.paid || 0)}</span></div>)}
    <h3>دليل الإدارة: ماذا يفعل كل قسم؟</h3>
    {[['المراجعة', 'اعتماد الحملات الجديدة، وصرف أرباح التسليمات المقبولة.'], ['المالية', 'مراجعة إثباتات الشحن وطلبات السحب (حوّل المبلغ الصافي يدويًا ثم اضغط تم)، وسجل العمليات المالية.'], ['طلبات توثيق المشاهدات', 'المعلن يراجع الرقم ويعتمد (ويُصرف المستحق تلقائيًا من ميزانية حملته). أنت تراقب، وتتدخل عند تأخر المعلن أو عند أي خلاف.'],
      ['المستخدمون', 'بحث، توثيق الحسابات، وإيقاف أو تفعيل حساب.'], ['كل الحملات', 'متابعة كل الحملات وإيقاف أو استئناف أي حملة.'], ['الطلبات والنزاعات', 'طلبات تغيير نوع الحساب وأي بلاغات من المستخدمين.'],
      ['الأسئلة الشائعة', 'ما تكتبه يظهر في صفحة FAQ للجميع.'], ['إعدادات المنصة', 'أرقام التحويل وطرق الدفع ورقم الدعم.'], ['سجل العمليات', 'من فعل ماذا ومتى، لمراجعة أي مشكلة.']].map(([t, d]) => <details className="card" key={t}><summary><b>{t}</b></summary><p className="mu">{d}</p></details>)}
    <p className="mu">قواعد أمان: لا يمكنك اعتماد دفعة أو سحب خاص بحسابك، وكل قرار مالي يُسجَّل باسمك.</p></>
}
