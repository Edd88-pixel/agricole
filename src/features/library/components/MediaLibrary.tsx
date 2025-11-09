import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import type { HistoryEntry } from '@/features/history/types/history';

type Props = {
  entries: HistoryEntry[];
  isLoading?: boolean;
};

type GalleryGroup = {
  crop: string;
  disease: string;
  date: string;
  images: string[];
  actions: string[];
  status: HistoryEntry['status'];
};

const MediaLibrary = ({ entries, isLoading = false }: Props) => {
  const { t, i18n } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedDisease, setSelectedDisease] = useState<string>('all');

  const groups = useMemo(() => {
    const aggregated = entries.reduce<GalleryGroup[]>((accumulator, entry) => {
      if (!entry.images || entry.images.length === 0) return accumulator;
      accumulator.push({
        crop: entry.crop,
        disease: entry.primary.label,
        date: entry.createdAt,
        images: entry.images,
        actions: entry.actions,
        status: entry.status
      });
      return accumulator;
    }, []);

    return aggregated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const crops = useMemo(() => Array.from(new Set(groups.map((item) => item.crop))), [groups]);
  const diseases = useMemo(() => Array.from(new Set(groups.map((item) => item.disease))), [groups]);

  const filtered = useMemo(() => {
    return groups.filter((group) => {
      const cropMatch = selectedCrop === 'all' || group.crop === selectedCrop;
      const diseaseMatch = selectedDisease === 'all' || group.disease === selectedDisease;
      return cropMatch && diseaseMatch;
    });
  }, [groups, selectedCrop, selectedDisease]);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">{t('library.title', 'Médiathèque')}</h1>
          <p className="text-sm text-brand-muted">{t('library.subtitle', 'Retrouvez vos images classées par culture et maladie.')}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted">{t('library.filterCrop', 'Culture')}</span>
            <select
              className="focus-ring rounded-2xl border border-subtle/70 bg-brand-surface/90 px-3 py-2 text-sm shadow-sm transition hover:border-brand-secondary/40"
              value={selectedCrop}
              onChange={(event) => setSelectedCrop(event.target.value)}
            >
              <option value="all">{t('library.allCrops', 'Toutes')}</option>
              {crops.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted">{t('library.filterDisease', 'Diagnostic')}</span>
            <select
              className="focus-ring rounded-2xl border border-subtle/70 bg-brand-surface/90 px-3 py-2 text-sm shadow-sm transition hover:border-brand-secondary/40"
              value={selectedDisease}
              onChange={(event) => setSelectedDisease(event.target.value)}
            >
              <option value="all">{t('library.allDiseases', 'Tous')}</option>
              {diseases.map((disease) => (
                <option key={disease} value={disease}>
                  {disease}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-muted">{t('library.empty', 'Aucune image disponible pour ces critères.')}</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((group) => {
            const formattedDate = new Date(group.date).toLocaleDateString(i18n.language, {
              dateStyle: 'medium'
            });
            return (
              <Card key={`${group.crop}-${group.disease}-${group.date}`} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
                    {group.crop} • {formattedDate}
                  </p>
                  <h2 className="text-lg font-semibold text-brand-text">{group.disease}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.images.map((image) => (
                    <figure
                      key={image}
                      className="group relative overflow-hidden rounded-2xl border border-subtle/70 bg-brand-background shadow-inner"
                    >
                      <img
                        src={image}
                        alt={group.disease}
                        className="h-40 w-full object-cover transition duration-300 motion-safe:group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                    </figure>
                  ))}
                </div>
                {group.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      {t('library.recommendedActions', 'Actions recommandées')}
                    </p>
                    <ul className="space-y-2 text-sm text-brand-text">
                      {group.actions.map((action) => (
                        <li
                          key={`${group.disease}-${action}`}
                          className="flex items-start gap-3 rounded-2xl border border-dashed border-subtle/60 bg-brand-background/70 p-3 text-brand-muted transition hover:border-brand-secondary/30 hover:text-brand-text"
                        >
                          <span className="mt-1 text-brand-secondary" aria-hidden>
                            •
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
