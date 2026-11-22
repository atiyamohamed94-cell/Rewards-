import { Analytics } from '@/components/Pages'
export default async function P({ searchParams }: any) { return <Analytics role="admin" sp={await searchParams} /> }
