import { Suspense, lazy } from 'react';
import Skeleton from '@/components/ui/Skeleton';

const HistoryReport = lazy(() => import('@/features/history/components/HistoryReport'));

const HistoryDetailsPage = () => (
  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
    <HistoryReport />
  </Suspense>
);

export default HistoryDetailsPage;
