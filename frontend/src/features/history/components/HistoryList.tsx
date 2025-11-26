import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import HistoryFilters from './HistoryFilters';
import HistoryListItem from './HistoryListItem';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import type { HistoryEntry } from '../types/history';

type Props = {
  entries: HistoryEntry[];
  onToggleResolved: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, updates: { context: string; stage: string }) => void | Promise<void>;
  isLoading?: boolean;
};

const HistoryList = ({ entries, onToggleResolved, onDelete, onUpdate, isLoading = false }: Props) => {
  const { t } = useTranslation();
  const {
    filtered,
    statusFilter,
    setStatusFilter,
    cropFilter,
    setCropFilter,
    stageFilter,
    setStageFilter,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    crops,
    stages,
    resetFilters
  } = useHistoryFilters(entries);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="flex flex-col gap-3 p-6 text-center">
        <h3 className="text-lg font-semibold text-brand-text">{t('history.emptyTitle', 'Aucune activité récente')}</h3>
        <p className="text-sm text-brand-muted">{t('history.emptyDescription', 'Lancez un nouveau diagnostic pour voir les résultats ici.')}</p>
        <Button asChild to="/diagnosis/quick" className="mx-auto">
          <span>{t('history.emptyCta', 'Nouveau diagnostic')}</span>
        </Button>
      </Card>
    );
  }

  const unresolved = filtered.filter((entry) => !entry.resolved);
  const resolved = filtered.filter((entry) => entry.resolved);

  const renderSection = (title: string, items: typeof filtered) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-brand-text">{title}</h4>
        <span className="text-xs font-medium text-brand-muted">{items.length}</span>
      </div>
      {items.map((entry) => (
        <HistoryListItem key={entry.id} entry={entry} onToggleResolved={onToggleResolved} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <HistoryFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        cropFilter={cropFilter}
        onCropChange={setCropFilter}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        crops={crops}
        stages={stages}
        onReset={resetFilters}
      />

      {filtered.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-brand-muted">
            {t('history.noResults', 'Aucun résultat avec ces filtres. Essayez d’élargir votre recherche.')}
          </p>
          <Button variant="ghost" className="mt-3 text-sm" onClick={resetFilters}>
            {t('history.resetFilters', 'Tout effacer')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {renderSection(t('history.unresolved', 'À faire'), unresolved)}
          {renderSection(t('history.resolved', 'Résolus'), resolved)}
        </div>
      )}
    </div>
  );
};

export default HistoryList;
