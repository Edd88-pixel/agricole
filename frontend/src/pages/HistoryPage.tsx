import HistoryList from '@/features/history/components/HistoryList';
import type { HistoryEntry } from '@/features/history/types/history';

type HistoryPageProps = {
  entries: HistoryEntry[];
  onToggleResolved: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: { context: string; stage: string }) => Promise<void>;
  isLoading?: boolean;
};

const HistoryPage = ({ entries, onToggleResolved, onDelete, onUpdate, isLoading }: HistoryPageProps) => {
  return (
    <HistoryList entries={entries} onToggleResolved={onToggleResolved} onDelete={onDelete} onUpdate={onUpdate} isLoading={isLoading} />
  );
};

export default HistoryPage;
