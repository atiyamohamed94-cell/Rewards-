'use client'
import { createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
const C = createContext('ar')
export const LangProvider = ({ lang, children }: any) => <C.Provider value={lang}>{children}</C.Provider>
export const useLang = () => { const lang = useContext(C); return { lang, tr: (ar: string, en: string) => lang === 'en' ? en : ar } }
export function LangToggle() {
  const { lang } = useLang(); const r = useRouter()
  return <button className="btn o" style={{ padding: '4px 10px' }} onClick={() => { document.cookie = 'lang=' + (lang === 'en' ? 'ar' : 'en') + ';path=/;max-age=31536000'; r.refresh() }}>{lang === 'en' ? 'عربي' : 'EN'}</button>
}
