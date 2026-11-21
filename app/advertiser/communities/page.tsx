import { Communities } from '@/components/Pages'
export default async function P({ searchParams }: any) { return <Communities sp={await searchParams} /> }
