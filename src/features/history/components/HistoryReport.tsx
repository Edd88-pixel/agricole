import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checklist from '@/components/ui/Checklist';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '@/app/providers/DataProvider';
import { useDiagnosisReport } from '@/features/diagnosis/hooks/useDiagnosisReport';

const HistoryReport = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { history, historyLoading } = useDataContext();
  const { generateReport, isGenerating } = useDiagnosisReport({ locale: i18n.language });

  const entry = useMemo(() => history.find((item) => item.id === id), [history, id]);

  if (historyLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!entry) {
    return <p className="text-sm text-brand-muted">{t('history.missing')}</p>;
  }

  return (
    <Card className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">{entry.primary.label}</h1>
          <p className="text-sm text-brand-muted">{new Date(entry.createdAt).toLocaleString()}</p>
        </div>
        <StatusBadge
          status={entry.status}
          label={{
            healthy: t('common.statusHealthy'),
            stressed: t('common.statusStressed'),
            sick: t('common.statusSick'),
            pending: t('common.loading')
          }[entry.status] ?? ''}
        />
      </header>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-brand-text">Actions</h2>
        <Checklist
          items={(entry.actions ?? []).map((action, index) => {
            const asString =
              typeof action === 'string'
                ? action
                : action && typeof action === 'object'
                ? [
                    typeof (action as any).label === 'string' ? (action as any).label : undefined,
                    typeof (action as any).description === 'string' ? (action as any).description : undefined
                  ]
                    .filter(Boolean)
                    .join(' — ')
                : String(action ?? '');
            return { id: `${entry.id}-${index}`, label: asString };
          })}
        />
      </section>
      {entry.images.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-brand-text">{t('diagnosis.mediaTitle', 'Images analysées')}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entry.images.map((image) => (
              <figure key={image} className="overflow-hidden rounded-2xl border border-brand-secondary/10 bg-brand-background">
                <img src={image} alt={t('diagnosis.mediaAlt', { defaultValue: 'Photo analysée' }) ?? 'Photo analysée'} className="h-40 w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      )}
      <Button variant="secondary" onClick={() => generateReport(entry)} isLoading={isGenerating}>
        {t('diagnosis.export')}
      </Button>
    </Card>
  );
};

export default HistoryReport;
