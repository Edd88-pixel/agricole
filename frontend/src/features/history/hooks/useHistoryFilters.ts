import { useMemo, useState } from 'react';
import type { HistoryEntry } from '../types/history';

export type FilterStatus = 'all' | 'open' | 'pending' | 'resolved';
export type SortOrder = 'newest' | 'oldest';

export const useHistoryFilters = (entries: HistoryEntry[]) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const crops = useMemo(() => Array.from(new Set(entries.map((entry) => entry.crop))).sort(), [entries]);
  const stages = useMemo(() => Array.from(new Set(entries.map((entry) => entry.stage))).sort(), [entries]);

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return [...entries]
      .filter((entry) => {
        if (statusFilter === 'resolved' && !entry.resolved) return false;
        if (statusFilter === 'pending' && entry.status !== 'pending') return false;
        if (statusFilter === 'open' && (entry.resolved || entry.status === 'pending')) return false;
        return true;
      })
      .filter((entry) => (cropFilter === 'all' ? true : entry.crop === cropFilter))
      .filter((entry) => (stageFilter === 'all' ? true : entry.stage === stageFilter))
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return (
          entry.primary.label.toLowerCase().includes(normalizedQuery) ||
          entry.context.toLowerCase().includes(normalizedQuery) ||
          entry.crop.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? -diff : diff;
      });
  }, [cropFilter, entries, search, sortOrder, stageFilter, statusFilter]);

  const resetFilters = () => {
    setStatusFilter('all');
    setCropFilter('all');
    setStageFilter('all');
    setSearch('');
    setSortOrder('newest');
  };

  return {
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
  };
};
