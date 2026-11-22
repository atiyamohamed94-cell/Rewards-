import Shell from '@/components/Shell'
import { guard } from '@/lib/server'
export default async function L({ children }: any) { await guard('creator'); return <Shell role="creator">{children}</Shell> }
