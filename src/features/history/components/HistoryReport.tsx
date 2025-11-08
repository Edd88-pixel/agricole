import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checklist from '@/components/ui/Checklist';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '@/app/providers/DataProvider';

const HistoryReport = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { history, historyLoading } = useDataContext();

  const entry = useMemo(() => history.find((item) => item.id === id), [history, id]);

  if (historyLoading) {
    return <Skeleton className="h-48 w-full" role="status" aria-label={t('common.loading')} />;
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
        <Checklist items={entry.actions.map((action, index) => ({ id: `${entry.id}-${index}`, label: action }))} />
      </section>
      <Button variant="secondary">{t('diagnosis.export')}</Button>
    </Card>
  );
};

export default HistoryReport;
