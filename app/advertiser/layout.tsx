import Shell from '@/components/Shell'
import { guard } from '@/lib/server'
export default async function L({ children }: any) { await guard('advertiser'); return <Shell role="advertiser">{children}</Shell> }
