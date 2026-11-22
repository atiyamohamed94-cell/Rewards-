'use client'
import { createContext, useContext, useEffect } from 'react'
import { EN } from '@/lib/dict'
import { useRouter } from 'next/navigation'
const C = createContext('ar')
export const LangProvider = ({ lang, children }: any) => <C.Provider value={lang}>{children}</C.Provider>
export const useLang = () => { const lang = useContext(C); return { lang, tr: (ar: string, en: string) => lang === 'en' ? en : ar } }
export function LangToggle() {
  const { lang } = useLang(); const r = useRouter()
  return <button className="btn o" style={{ padding: '4px 10px' }} onClick={() => { document.cookie = 'lang=' + (lang === 'en' ? 'ar' : 'en') + ';path=/;max-age=31536000'; r.refresh() }}>{lang === 'en' ? 'عربي' : 'EN'}</button>
}

export function AutoTranslate() {
  const { lang } = useLang()
  useEffect(() => { if (lang !== 'en') return
    const tx = (n: Node) => { if (n.nodeType === 3) { const v = n.nodeValue || ''; const k = v.trim(); if (k && EN[k]) n.nodeValue = v.replace(k, EN[k]) }
      else if (n instanceof HTMLElement) ['placeholder', 'title', 'aria-label'].forEach(a => { const k = n.getAttribute(a)?.trim(); if (k && EN[k]) n.setAttribute(a, EN[k]) }) }
    const walk = (r: Node) => { tx(r); r.childNodes.forEach(walk) }; walk(document.body)
    const mo = new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(walk); if (m.type !== 'childList') tx(m.target) }))
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] })
    return () => mo.disconnect() }, [lang])
  return null
}
