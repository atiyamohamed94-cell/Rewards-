import Link from 'next/link'
import { Kit } from '@/components/Features'
import { sb } from '@/lib/server'
import Logo from '@/components/Logo'
export const dynamic = 'force-dynamic'
export default async function P({ params }: any) {
  const s = await sb(); const session = (await s.auth.getSession()).data.session
  return <><header className="top"><Link href="/"><Logo /></Link>{!session && <Link className="btn s" href="/login">دخول</Link>}</header><div className="wrap">
    {session ? <Kit id={(await params).id} /> : <div className="card"><p>سجّل الدخول لعرض ملف المبدع.</p><Link className="btn" href="/login">تسجيل الدخول</Link></div>}</div></>
}
