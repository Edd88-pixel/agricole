import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import type { HistoryEntry } from '../types/history';

type Props = {
  entries: HistoryEntry[];
  onToggleResolved: (id: string) => void;
};

const HistoryList = ({ entries, onToggleResolved }: Props) => {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-muted">{t('history.empty')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-text">{entry.primary.label}</h3>
            <p className="text-sm text-brand-muted">{new Date(entry.createdAt).toLocaleString()}</p>
            <p className="text-sm text-brand-muted">{entry.context}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              status={entry.status}
              label={{
                healthy: t('common.statusHealthy'),
                stressed: t('common.statusStressed'),
                sick: t('common.statusSick'),
                pending: t('common.loading')
              }[entry.status] ?? ''}
            />
            <Button variant="secondary" onClick={() => onToggleResolved(entry.id)}>
              {entry.resolved ? t('history.markResolved') : t('history.markResolved')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HistoryList;
