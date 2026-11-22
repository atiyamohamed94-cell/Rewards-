import { Analytics } from '@/components/Pages'
export default async function P({ searchParams }: any) { return <Analytics role="creator" sp={await searchParams} /> }
