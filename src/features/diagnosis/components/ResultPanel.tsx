import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Checklist from '@/components/ui/Checklist';
import Button from '@/components/ui/Button';
import type { DiagnosisResult } from '../types/diagnosis';

const ResultPanel = ({ result }: { result: DiagnosisResult }) => {
  const { t } = useTranslation();
  const statusLabel = {
    healthy: t('common.statusHealthy'),
    stressed: t('common.statusStressed'),
    sick: t('common.statusSick')
  }[result.status];

  const lowConfidence = result.confidence < 0.4;

  return (
    <Card className="space-y-6 bg-brand-surface">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
            {t('diagnosis.primaryResult')}
          </p>
          <h2 className="text-2xl font-bold text-brand-text">{result.primary.label}</h2>
          <p className="text-sm text-brand-muted">{result.primary.description}</p>
        </div>
        <StatusBadge status={result.status} label={statusLabel ?? ''} />
      </header>
      {lowConfidence && (
        <p className="rounded-xl border border-brand-warning bg-brand-warning/10 p-4 text-sm text-brand-warning">
          {t('diagnosis.confidenceLow')}
        </p>
      )}
      {result.alternatives.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-brand-text">{t('diagnosis.alternatives')}</h3>
          <ul className="mt-2 grid gap-3 md:grid-cols-2" role="list">
            {result.alternatives.map((item) => (
              <li key={item.label} className="rounded-xl border border-subtle bg-brand-background p-4">
                <p className="font-semibold text-brand-text">{item.label}</p>
                <p className="text-sm text-brand-muted">{t('diagnosis.scores')}: {(item.confidence * 100).toFixed(0)}%</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="text-sm font-semibold text-brand-text">{t('diagnosis.checklistTitle')}</h3>
        <Checklist items={result.actions.map((action, index) => ({ id: `${result.id}-${index}`, label: action }))} />
      </section>
      <footer className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button variant="secondary">{t('diagnosis.export')}</Button>
        <div className="flex items-center gap-3 text-sm text-brand-muted">
          <span aria-hidden>⏰</span>
          {t('diagnosis.reminder')}
        </div>
        <Button variant="ghost">{t('common.feedbackUseful')}</Button>
      </footer>
    </Card>
  );
};

export default ResultPanel;
