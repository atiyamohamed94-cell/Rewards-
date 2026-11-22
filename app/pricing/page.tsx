import Public from '@/components/Public'
import { getLang } from '@/lib/lang'
export default async function P() {
  const en = (await getLang()) === 'en'; const t = (a: string, e: string) => en ? e : a
  return <Public><h1>{t('الأسعار والرسوم', 'Pricing & fees')}</h1><p className="mu">{t('التسجيل مجاني. لا توجد اشتراكات، نحن نكسب فقط عندما تكسب أنت.', 'Signing up is free. No subscriptions: we only earn when you do.')}</p>
    <div className="grid"><div className="card"><div className="big g">15%</div><b>{t('على المعلن', 'Advertisers')}</b><p className="mu">{t('تُخصم عند تمويل الحملة من رصيدك. ميزانية الحملة هي ما يصل فعليًا للمبدعين.', 'Deducted when you fund a campaign from your balance. The campaign budget is what actually reaches creators.')}</p></div>
      <div className="card"><div className="big g">5%</div><b>{t('على المبدع', 'Creators')}</b><p className="mu">{t('رسوم عند السحب فقط، والحد الأدنى للسحب 50 جنيهًا.', 'A fee on withdrawals only. Minimum withdrawal is 50 EGP.')}</p></div></div>
    <div className="card"><h3>{t('مثال', 'Example')}</h3>
      <p>{t('معلن موّل حملة بمبلغ 1000 ج.م ← عمولة 150 ج.م ← يصل للحملة 850 ج.م.', 'An advertiser funds 1,000 EGP → 150 EGP fee → 850 EGP reaches the campaign.')}</p>
      <p>{t('مبدع سحب 500 ج.م ← رسوم 25 ج.م ← يستلم 475 ج.م.', 'A creator withdraws 500 EGP → 25 EGP fee → receives 475 EGP.')}</p></div>
    <div className="card"><h3>{t('طرق الدفع', 'Payment methods')}</h3><p className="mu">{t('InstaPay والمحافظ الإلكترونية بالجنيه المصري. تتم مراجعة كل عملية شحن وسحب من فريق الإدارة.', 'InstaPay and e-wallets in EGP. Every top-up and withdrawal is reviewed by our team.')}</p></div></Public>
}
