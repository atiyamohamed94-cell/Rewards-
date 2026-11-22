export const DEFAULT_SUPPORT = '01009203458'
export const waLink = (t: string) => { const d = String(t).replace(/\D/g, ''); return /^01\d{9}$/.test(d) ? 'https://wa.me/20' + d.slice(1) : /^20\d{10}$/.test(d) ? 'https://wa.me/' + d : '' }
