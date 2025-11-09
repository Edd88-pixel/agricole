import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Checklist from '@/components/ui/Checklist';
import Button from '@/components/ui/Button';
import type { DiagnosisResult } from '../types/diagnosis';
import { useDiagnosisReport } from '../hooks/useDiagnosisReport';
import { submitDiagnosisFeedback } from '@/services/supabase/feedback';

const ResultPanel = ({ result }: { result: DiagnosisResult }) => {
  const { t, i18n } = useTranslation();
  const { generateReport, isGenerating, error: reportError } = useDiagnosisReport({ locale: i18n.language });
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackChoice, setFeedbackChoice] = useState<boolean | null>(null);
  const statusLabel = {
    healthy: t('common.statusHealthy'),
    stressed: t('common.statusStressed'),
    sick: t('common.statusSick'),
    pending: t('common.statusPending')
  }[result.status];

  const lowConfidence = result.confidence < 0.4;
  const formattedDate = new Date(result.createdAt).toLocaleString(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const handleFeedback = async (useful: boolean) => {
    if (feedbackStatus === 'submitting') return;
    setFeedbackChoice(useful);
    setFeedbackStatus('submitting');
    try {
      await submitDiagnosisFeedback({ diagnosisId: result.id, useful });
      setFeedbackStatus('success');
    } catch (error) {
      console.error('Unable to submit diagnosis feedback', error);
      setFeedbackStatus('error');
    }
  };

  return (
    <Card className="space-y-6 bg-brand-surface">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
            {t('diagnosis.primaryResult')}
          </p>
          <h2 className="text-2xl font-bold text-brand-text">{result.primary.label}</h2>
          <p className="text-sm text-brand-muted whitespace-pre-line">{result.primary.description}</p>
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
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-subtle bg-brand-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            {t('diagnosis.cropLabel')}
          </p>
          <p className="mt-1 text-base font-semibold text-brand-text">{result.crop}</p>
          <p className="mt-1 text-sm text-brand-muted">{t('diagnosis.stageLabel')}: {result.stage}</p>
          <p className="mt-2 text-xs text-brand-muted">{formattedDate}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-brand-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            {t('diagnosis.symptomsLabel')}
          </p>
          <ul className="mt-1 space-y-1 text-sm text-brand-text">
            {result.symptoms.map((symptom) => (
              <li key={symptom}>{symptom}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">
            {t('diagnosis.contextLabel')}
          </p>
          <p className="mt-1 text-sm text-brand-text whitespace-pre-line">{result.context}</p>
        </div>
      </section>
      {result.images.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-brand-text">{t('diagnosis.mediaTitle', 'Images analysées')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.images.map((image) => (
              <figure key={image} className="overflow-hidden rounded-2xl border border-brand-secondary/10 bg-brand-background">
                <img src={image} alt={t('diagnosis.mediaAlt', { defaultValue: 'Photo analysée' }) ?? 'Photo analysée'} className="h-48 w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      )}
      <section>
        <h3 className="text-sm font-semibold text-brand-text">{t('diagnosis.checklistTitle')}</h3>
        <Checklist items={result.actions.map((action, index) => ({ id: `${result.id}-${index}`, label: action }))} />
      </section>
      <section className="rounded-2xl border border-subtle bg-brand-background/60 p-4">
        <p className="text-sm font-semibold text-brand-text">{t('diagnosis.feedbackQuestion')}</p>
        <p className="mt-1 text-xs text-brand-muted">{t('diagnosis.feedbackHint')}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            type="button"
            variant={feedbackChoice === true ? 'primary' : 'secondary'}
            onClick={() => handleFeedback(true)}
            isLoading={feedbackStatus === 'submitting' && feedbackChoice === true}
          >
            <span aria-hidden>👍</span> {t('diagnosis.feedbackYes')}
          </Button>
          <Button
            type="button"
            variant={feedbackChoice === false ? 'primary' : 'ghost'}
            onClick={() => handleFeedback(false)}
            isLoading={feedbackStatus === 'submitting' && feedbackChoice === false}
          >
            <span aria-hidden>👎</span> {t('diagnosis.feedbackNo')}
          </Button>
        </div>
        <div aria-live="polite" className="mt-3 min-h-[20px] text-sm">
          {feedbackStatus === 'success' && (
            <span className="text-brand-secondary">{t('diagnosis.feedbackThanks')}</span>
          )}
          {feedbackStatus === 'error' && (
            <span className="text-brand-danger">{t('diagnosis.feedbackError')}</span>
          )}
        </div>
      </section>
      <footer className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button variant="secondary" onClick={() => generateReport(result)} isLoading={isGenerating}>
          {t('diagnosis.export')}
        </Button>
        <div className="flex items-center gap-3 text-sm text-brand-muted">
          <span aria-hidden>⏰</span>
          {t('diagnosis.reminder')}
        </div>
      </footer>
      {reportError && (
        <p className="rounded-lg border border-brand-danger bg-brand-danger/10 p-3 text-sm text-brand-danger">
          {reportError}
        </p>
      )}
    </Card>
  );
};

export default ResultPanel;
