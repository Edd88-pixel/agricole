import MediaLibrary from '@/features/library/components/MediaLibrary';
import type { HistoryEntry } from '@/features/history/types/history';

type MediaLibraryPageProps = {
  entries: HistoryEntry[];
  isLoading: boolean;
};

const MediaLibraryPage = ({ entries, isLoading }: MediaLibraryPageProps) => {
  return <MediaLibrary entries={entries} isLoading={isLoading} />;
};

export default MediaLibraryPage;
