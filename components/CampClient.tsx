'use client'
import { useState } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/client'
import { useRun } from './Forms'
const sbc = createClient()
export function JoinCampaign({ id }: any) {
  const { busy, msg, run } = useRun(); const [m, setM] = useState('')
  return <div><input placeholder="رسالة قصيرة (اختياري)" value={m} onChange={e => setM(e.target.value)} />
    <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={() => run(() => sbc.rpc('join_campaign', { p_campaign: id, p_message: m }), 'تم الانضمام للحملة ✓')}>انضم للحملة الآن</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
export function FundFull({ id, remaining }: any) {
  const { busy, msg, run } = useRun()
  return <span><button className="btn" disabled={busy} onClick={() => { if (confirm(`دفع ${remaining} ج.م من رصيدك لتمويل الحملة (تُخصم عمولة المنصة 15% تلقائيًا)؟`)) run(() => sbc.rpc('fund_campaign', { p_campaign: id, p_amount: remaining }), 'تم التمويل') }}>تمويل الميزانية ({remaining} ج.م)</button>{msg && <span className="mu"> {msg}</span>}</span>
}
const urls = (t: string) => t.split('\n').map(x => x.trim()).filter(Boolean)
const U = z.string().url()
const sch = z.object({ title: z.string().min(3, 'العنوان قصير'), brand_name: z.string().min(2, 'اسم البراند مطلوب'), description: z.string().min(20, 'الوصف 20 حرفًا على الأقل'),
  budget: z.number().positive('أدخل الميزانية'), fixed_reward: z.number().min(0), cpm_rate: z.number().min(0), creators_needed: z.number().int().min(1), min_views: z.number().int().min(0) })
export function NewCampaign({ uid }: any) {
  const { busy, msg, run } = useRun(); const [f, setF] = useState<any>({ campaign_type: 'clipping', compensation_type: 'cpm', creators_needed: 20, fixed_reward: 0, cpm_rate: 0, min_views: 0, approval: 'auto' })
  const [pl, setPl] = useState<string[]>(['tiktok']); const [img, setImg] = useState<File | null>(null)
  const set = (k: string, num = false) => (e: any) => setF({ ...f, [k]: num ? +e.target.value : e.target.value })
  const ugc = f.campaign_type === 'ugc'; const comp = ugc && f.compensation_type === 'cpm' ? 'fixed' : f.compensation_type
  const budget = +f.budget || 0
  const L = (t: string) => <label>{t}</label>
  return <div className="card"><h3>حملة جديدة</h3>
    {L('صورة الحملة (تظهر للمبدعين، حتى 3MB)')}<input type="file" accept="image/*" onChange={e => setImg(e.target.files?.[0] || null)} />
    {L('العنوان')}<input onChange={set('title')} />{L('اسم البراند')}<input onChange={set('brand_name')} />{L('وصف الحملة (ما المطلوب بالتفصيل)')}<textarea rows={4} onChange={set('description')} />
    <div className="grid"><div>{L('نوع الحملة')}<select onChange={set('campaign_type')}><option value="clipping">Clipping (قص مقاطع)</option><option value="ugc">UGC (محتوى للبراند)</option><option value="influencer">Influencer</option><option value="posting">Posting (نشر)</option></select></div>
      <div>{L('نوع المكافأة')}<select value={comp} onChange={set('compensation_type')}><option value="cpm">حسب المشاهدات (CPM)</option><option value="fixed">مبلغ ثابت لكل فيديو</option><option value="hybrid">ثابت + مشاهدات</option></select></div></div>
    {L('المنصات المسموحة')}<div className="row" style={{ justifyContent: 'flex-start' }}>{['tiktok', 'instagram', 'youtube', 'facebook'].map(p => <label key={p}><input type="checkbox" style={{ width: 'auto', margin: '0 6px' }} checked={pl.includes(p)} onChange={e => setPl(e.target.checked ? [...pl, p] : pl.filter(x => x !== p))} />{p}</label>)}</div>
    <div className="grid"><div>{L('الميزانية الإجمالية (ج.م)')}<input type="number" onChange={set('budget', true)} /></div>
      {comp !== 'fixed' && <div>{L('سعر الألف مشاهدة (ج.م)')}<input type="number" onChange={set('cpm_rate', true)} /></div>}
      {comp !== 'cpm' && <div>{L('المكافأة الثابتة لكل فيديو (ج.م)')}<input type="number" onChange={set('fixed_reward', true)} /></div>}
      {comp !== 'fixed' && <div>{L('الحد الأدنى للمشاهدات لبدء الربح')}<input type="number" placeholder="0 = من أول مشاهدة" onChange={set('min_views', true)} /></div>}
      <div>{L('عدد المبدعين المطلوب')}<input type="number" defaultValue={20} onChange={set('creators_needed', true)} /></div></div>
    {budget > 0 && <p className="mu">عمولة المنصة 15% تُخصم تلقائيًا: {(budget * 0.15).toFixed(0)} ج.م · يصل للمبدعين {(budget * 0.85).toFixed(0)} ج.م</p>}
    <div className="grid"><div>{L('تاريخ البداية')}<input type="date" onChange={set('starts')} /></div><div>{L('تاريخ النهاية')}<input type="date" onChange={set('ends')} /></div></div>
    {L('قبول المبدعين')}<select onChange={set('approval')}><option value="auto">تلقائي (ينضم المبدع فورًا)</option><option value="manual">بموافقتي أنا</option></select>
    {L('الجمهور المستهدف')}<input placeholder="مثال: شباب 18-30 في مصر" onChange={set('target_audience')} />
    {L('إرشادات المحتوى (افعل)')}<textarea rows={2} onChange={set('guidelines')} />{L('ممنوعات (لا تفعل)')}<textarea rows={2} onChange={set('dont')} />
    <div className="grid"><div>{L('مدة الفيديو')}<input placeholder="مثال: 15-45 ثانية" onChange={set('video_length')} /></div><div>{L('اللغة / اللهجة')}<input placeholder="مصرية" onChange={set('language')} /></div></div>
    {L('الهاشتاجات والإشارات المطلوبة')}<input placeholder="#اسم_البراند @حسابك" onChange={set('hashtags')} />
    {L('روابط الخامات (فيديوهات/ملفات، رابط في كل سطر)')}<textarea rows={3} dir="ltr" placeholder="https://drive.google.com/..." onChange={set('materials')} />
    {L('أمثلة مرجعية على المحتوى المطلوب (رابط في كل سطر)')}<textarea rows={2} dir="ltr" onChange={set('examples')} />
    {L('صفحات البراند على السوشيال ميديا')}<div className="grid">{['instagram', 'tiktok', 'youtube', 'facebook', 'website'].map(k => <input key={k} dir="ltr" placeholder={k + ' URL'} onChange={set('s_' + k)} />)}</div>
    {L('رابط خارجي إضافي (اختياري)')}<input dir="ltr" onChange={set('link')} />
    <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={() => run(async () => {
      const p = sch.safeParse({ ...f, creators_needed: +f.creators_needed, min_views: +f.min_views || 0, fixed_reward: comp === 'cpm' ? 0 : +f.fixed_reward || 0, cpm_rate: comp === 'fixed' ? 0 : +f.cpm_rate || 0 })
      if (!p.success) return { error: { message: p.error.issues[0].message } }
      if (!pl.length) return { error: { message: 'اختر منصة واحدة على الأقل' } }
      if (comp !== 'fixed' && !(+f.cpm_rate > 0)) return { error: { message: 'أدخل سعر الألف مشاهدة' } }
      if (comp !== 'cpm' && !(+f.fixed_reward > 0)) return { error: { message: 'أدخل المكافأة الثابتة' } }
      if (f.starts && f.ends && f.ends <= f.starts) return { error: { message: 'تاريخ النهاية يجب أن يكون بعد البداية' } }
      const mats = urls(f.materials || ''), exs = urls(f.examples || ''); const socials: any = {}
      for (const k of ['instagram', 'tiktok', 'youtube', 'facebook', 'website']) { const v = (f['s_' + k] || '').trim(); if (v) { if (!U.safeParse(v).success) return { error: { message: 'رابط غير صالح: ' + k } }; socials[k] = v } }
      for (const u of [...mats, ...exs, ...(f.link ? [f.link] : [])]) if (!U.safeParse(u).success) return { error: { message: 'رابط غير صالح: ' + u.slice(0, 40) } }
      let image_url: string | null = null
      if (img) { if (img.size > 3e6) return { error: { message: 'الصورة أكبر من 3MB' } }
        const path = `${uid}/${Date.now()}-${img.name.replace(/[^\w.]/g, '_')}`; const up = await sbc.storage.from('campaign-images').upload(path, img); if (up.error) return up
        image_url = sbc.storage.from('campaign-images').getPublicUrl(path).data.publicUrl }
      const d = p.data
      return sbc.from('campaigns').insert({ advertiser_id: uid, status: 'draft', currency: 'EGP', title: d.title, brand_name: d.brand_name, description: d.description, campaign_type: f.campaign_type, compensation_type: comp,
        budget: d.budget, fixed_reward: d.fixed_reward, cpm_rate: d.cpm_rate, creators_needed: d.creators_needed, platforms: pl, target_audience: f.target_audience || null, image_url, link: f.link || null,
        starts_at: f.starts || null, ends_at: f.ends || null,
        requirements: { approval: f.approval, min_views: d.min_views, guidelines: f.guidelines || '', dont: f.dont || '', video_length: f.video_length || '', language: f.language || '', hashtags: f.hashtags || '', materials: mats, examples: exs, socials } })
    }, 'تم حفظ المسودة. موّلها ثم أرسلها للاعتماد')}>حفظ كمسودة</button>{msg && <p className="mu" role="status">{msg}</p>}</div>
}
