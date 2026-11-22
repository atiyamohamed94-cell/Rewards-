import Link from 'next/link'
export default function Pager({ page, total, ps, sp, base }: any) {
  const pages = Math.ceil((total || 0) / ps); if (pages <= 1) return null
  const href = (p: number) => { const u = new URLSearchParams(); Object.entries(sp || {}).forEach(([k, v]: any) => { if (k !== 'page' && v) u.set(k, String(v)) }); u.set('page', String(p)); return base + '?' + u }
  return <div className="row">{page > 1 ? <Link className="btn o" href={href(page - 1)}>السابق</Link> : <span />}<span className="mu">{page} / {pages}</span>{page < pages ? <Link className="btn o" href={href(page + 1)}>التالي</Link> : <span />}</div>
}
