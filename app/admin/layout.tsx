import Shell from '@/components/Shell'
import { guard } from '@/lib/server'
export default async function L({ children }: any) { await guard('admin'); return <Shell role="admin">{children}</Shell> }
