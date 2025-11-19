import DashboardHome from '@/features/dashboard/components/DashboardHome';
import type { HistoryEntry } from '@/features/history/types/history';

type DashboardPageProps = {
  userName: string;
  greetingName: string;
  recent: HistoryEntry[];
  isLoading: boolean;
};

const DashboardPage = ({ userName, greetingName, recent, isLoading }: DashboardPageProps) => (
  <DashboardHome userName={userName} greetingName={greetingName} recent={recent} isLoading={isLoading} />
);

export default DashboardPage;
