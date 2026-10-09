import { ActivityDetail } from '@/components/ActivityDetail';
export default function Page({ params }: { params: { id: string } }) { return <ActivityDetail id={params.id} />; }
