import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { FilterStatus, SortOrder } from '../hooks/useHistoryFilters';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusChange: (value: FilterStatus) => void;
  cropFilter: string;
  onCropChange: (value: string) => void;
  stageFilter: string;
  onStageChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortChange: (value: SortOrder) => void;
  crops: string[];
  stages: string[];
  onReset: () => void;
};

const HistoryFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  cropFilter,
  onCropChange,
  stageFilter,
  onStageChange,
  sortOrder,
  onSortChange,
  crops,
  stages,
  onReset
}: Props) => {
  const { t } = useTranslation();

  const handleSelect = (handler: (value: string) => void) => (event: ChangeEvent<HTMLSelectElement>) => {
    handler(event.target.value);
  };

  return (
    <Card className="flex flex-col gap-3 border border-subtle/70 bg-brand-surface/80 p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap gap-2">
        <input
          className="focus-ring min-w-[220px] flex-1 rounded-xl border border-subtle/70 bg-white/90 px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted"
          placeholder={t('history.searchPlaceholder', 'Rechercher (titre, lieu, culture)...')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={t('history.search', 'Rechercher')}
        />
        <select
          className="focus-ring rounded-xl border border-subtle/70 bg-white/90 px-3 py-2 text-sm text-brand-text"
          value={statusFilter}
          onChange={handleSelect((value) => onStatusChange(value as FilterStatus))}
          aria-label={t('history.filterStatus', 'Filtrer par statut')}
        >
          <option value="all">{t('history.statusAll', 'Tous les statuts')}</option>
          <option value="open">{t('history.statusOpen', 'En cours')}</option>
          <option value="pending">{t('history.statusPending', 'En attente')}</option>
          <option value="resolved">{t('history.statusResolved', 'Résolus')}</option>
        </select>
        <select
          className="focus-ring rounded-xl border border-subtle/70 bg-white/90 px-3 py-2 text-sm text-brand-text"
          value={cropFilter}
          onChange={handleSelect(onCropChange)}
          aria-label={t('history.filterCrop', 'Filtrer par culture')}
        >
          <option value="all">{t('history.cropAll', 'Toutes les cultures')}</option>
          {crops.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>
        <select
          className="focus-ring rounded-xl border border-subtle/70 bg-white/90 px-3 py-2 text-sm text-brand-text"
          value={stageFilter}
          onChange={handleSelect(onStageChange)}
          aria-label={t('history.filterStage', 'Filtrer par stade')}
        >
          <option value="all">{t('history.stageAll', 'Tous les stades')}</option>
          {stages.map((stageValue) => (
            <option key={stageValue} value={stageValue}>
              {stageValue}
            </option>
          ))}
        </select>
        <select
          className="focus-ring rounded-xl border border-subtle/70 bg-white/90 px-3 py-2 text-sm text-brand-text"
          value={sortOrder}
          onChange={handleSelect((value) => onSortChange(value as SortOrder))}
          aria-label={t('history.sort', 'Trier')}
        >
          <option value="newest">{t('history.sortNewest', 'Plus récents')}</option>
          <option value="oldest">{t('history.sortOldest', 'Plus anciens')}</option>
        </select>
      </div>
      <Button variant="ghost" onClick={onReset} className="self-start text-sm">
        {t('history.resetFilters', 'Tout effacer')}
      </Button>
    </Card>
  );
};

export default HistoryFilters;
