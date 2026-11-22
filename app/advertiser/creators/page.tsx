import { CreatorsDirectory } from '@/components/Features'
export default async function P({ searchParams }: any) { return <CreatorsDirectory sp={await searchParams} /> }
