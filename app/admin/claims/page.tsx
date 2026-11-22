import Link from 'next/link'
import { ClaimsList } from '@/components/AdminParts'
export default async function P({ searchParams }: any) { const st = ['approved', 'rejected'].includes((await searchParams).s) ? (await searchParams).s : 'pending'; return <><h2>طلبات توثيق المشاهدات</h2><div className="row"><Link className="btn o" href="?s=pending">الجديدة</Link><Link className="btn o" href="?s=approved">المعتمدة</Link><Link className="btn o" href="?s=rejected">المرفوضة</Link></div><br /><ClaimsList role="admin" status={st} /></> }
