import { Leaderboard } from '@/components/Leaderboard'
export default async function P({ searchParams }: any) { return <Leaderboard role="advertiser" sp={await searchParams} /> }
