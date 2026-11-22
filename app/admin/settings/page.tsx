import { sb } from '@/lib/server'
import { SettingEdit } from '@/components/Forms'
export const dynamic = 'force-dynamic'
export default async function P() { const s = await sb(); const { data } = await s.from('platform_settings').select('key,value').order('key')
  return <><h2>إعدادات المنصة</h2><p className="mu">عدّل القيمة واضغط حفظ. الأرقام تُحفظ كأرقام والنصوص كنصوص. العمولات (15% و5%) مثبّتة في دوال قاعدة البيانات ولا تتغير من هنا.</p>
    {data?.map((r: any) => <SettingEdit key={r.key} k={r.key} current={r.value} />)}</> }
