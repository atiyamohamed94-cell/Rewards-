import { GroupChat } from '@/components/Groups'
export default async function P({ params }: any) { return <GroupChat id={(await params).id} role="creator" /> }
