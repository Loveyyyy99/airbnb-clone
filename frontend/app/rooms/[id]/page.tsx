import { ListingDetail } from '@/components/ListingDetail';
export default function Page({ params }: { params: { id: string } }) { return <ListingDetail id={params.id} />; }
