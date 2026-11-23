import { CampaignDetails } from '@/components/Campaign'
export default async function P({ params }: any) { return <CampaignDetails id={(await params).id} role="admin" /> }
