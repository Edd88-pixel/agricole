import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import UploadZone from '@/components/ui/UploadZone';
import DiagnosisResultPanel from './ResultPanel';
import { runInference } from '../services/inference';
import type { DiagnosisResult } from '../types/diagnosis';

const schema = z.object({
  crop: z.string().min(2),
  stage: z.string().min(2),
  symptomsText: z.string().min(2),
  context: z.string().min(3)
});

type FormValues = z.infer<typeof schema>;

const steps: (keyof FormValues)[] = ['crop', 'symptomsText', 'context'];

const optionKeys = {
  crop: ['domain.crops.maize', 'domain.crops.wheat', 'domain.crops.cotton', 'domain.crops.rice'] as const,
  stage: ['domain.stages.sowing', 'domain.stages.vegetative', 'domain.stages.flowering', 'domain.stages.harvest'] as const
};

type GuidedProps = {
  onResult?: (result: DiagnosisResult) => void;

};

const GuidedScanForm = ({ onResult }: GuidedProps) => {
  
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({

    resolver: zodResolver(schema),
    defaultValues: { crop: '', stage: '', symptomsText: '', context: '' }
  });


  const labels = [t('diagnosis.cropLabel'), t('diagnosis.symptomsLabel'), t('diagnosis.contextLabel')];

  const goNext = async () => {
    const key = steps[step];
    const fields = key === 'crop' ? ['crop', 'stage'] : [key];
    const isValid = await form.trigger(fields as (keyof FormValues)[]);
    if (isValid) {
      if (step === steps.length - 1) {
        setSubmitting(true);
        setError(null);
        const values = form.getValues();
        try {
          if (files.length === 0) {
            throw new Error('missing-files');
          }
          const symptoms = values.symptomsText
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          const inference = await runInference({
            crop: values.crop,
            stage: values.stage,
            symptoms,
            context: values.context,
            files
          });
          setResult(inference);
          onResult?.(inference);
        } catch (submissionError) {
          console.error('Guided scan submission failed', submissionError);
          if ((submissionError as Error).message === 'missing-files') {
            setError(t('diagnosis.uploadHint'));
          } else {
            setError(t('diagnosis.errorGeneral'));
          }
        } finally {
          setSubmitting(false);
        }
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-3 sm:px-0">
      <Card className="space-y-8 border border-subtle/70 bg-brand-surface/90 p-4 shadow-card sm:p-8">
        <header className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold text-brand-text">{t('dashboard.guidedScan')}</h1>
            <span className="rounded-full border border-brand-secondary/30 bg-brand-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-secondary shadow-sm">
              {t('diagnosis.uploadTitle')}
            </span>
          </div>
          <div className="rounded-3xl border border-brand-secondary/25 bg-white/85 p-4 shadow-inner dark:border-brand-secondary/40 dark:bg-brand-surface/40">
            <div className="overflow-x-auto">
              <div className="min-w-[420px] space-y-5 px-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  {labels.map((label, index) => {
                    const isCurrent = step === index;
                    const isCompleted = step > index;
                    return (
                      <div
                        key={`step-track-${label}`}
                        className={clsx(
                          'flex items-center',
                          index < labels.length - 1 ? 'flex-1' : 'flex-none'
                        )}
                      >
                        <div
                          className={clsx(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                            isCompleted || isCurrent
                              ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                              : 'border-brand-muted/40 bg-white text-brand-text dark:border-subtle/60 dark:bg-brand-surface/70 dark:text-brand-muted'
                          )}
                        >
                          {index + 1}
                        </div>
                        {index < labels.length - 1 && (
                          <div
                            className={clsx(
                              'ml-3 h-1 flex-1 rounded-full sm:ml-4',
                              isCompleted ? 'bg-brand-primary' : 'bg-brand-muted/30 dark:bg-brand-muted/40'
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  className="grid gap-4 text-center text-xs font-medium sm:text-sm"
                  style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
                >
                  {labels.map((label, index) => {
                    const isCurrent = step === index;
                    const isCompleted = step > index;
                    return (
                      <div key={`step-label-${label}`} className="space-y-1">
                        <p
                          className={clsx(
                            'font-semibold',
                            isCurrent ? 'text-brand-primary' : 'text-brand-text dark:text-brand-muted'
                          )}
                        >
                          {label}
                        </p>
                        <p
                          className={clsx(
                            'text-[11px] uppercase tracking-wide sm:text-xs',
                            isCompleted
                              ? 'text-brand-primary'
                              : isCurrent
                                ? 'text-brand-primary'
                                : 'text-brand-muted'
                          )}
                        >
                          {isCompleted
                            ? t('diagnosis.stepper.completed', 'Terminée')
                            : isCurrent
                              ? t('diagnosis.stepper.current', 'En cours')
                              : t('diagnosis.stepper.upcoming', 'À venir')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="w-full rounded-3xl border border-dashed border-brand-secondary/40 bg-white/70 p-3 dark:border-brand-secondary/50 dark:bg-brand-surface/30">
          <UploadZone files={files} onChange={setFiles} />
        </div>
        <form className="space-y-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-3">
                <span className="text-sm font-medium text-brand-text">{t('diagnosis.cropLabel')}</span>
                <select
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60 dark:border-brand-secondary/50 dark:bg-brand-surface/60 dark:text-brand-text"
                  {...form.register('crop')}
                >
                  <option value="">--</option>
                  {optionKeys.crop.map((key) => (
                    <option key={key} value={t(key)}>
                      {t(key)}
                    </option>
                  ))}
                </select>
                {form.formState.errors.crop && (
                  <span className="text-sm text-brand-danger">{form.formState.errors.crop.message}</span>
                )}
              </label>

              <label className="space-y-3">
                <span className="text-sm font-medium text-brand-text">{t('diagnosis.stageLabel')}</span>
                <select
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60 dark:border-brand-secondary/50 dark:bg-brand-surface/60 dark:text-brand-text"
                  {...form.register('stage')}
                >
                  <option value="">--</option>
                  {optionKeys.stage.map((key) => (
                    <option key={key} value={t(key)}>
                      {t(key)}
                    </option>
                  ))}
                </select>
                {form.formState.errors.stage && (
                  <span className="text-sm text-brand-danger">{form.formState.errors.stage.message}</span>
                )}
              </label>
            </div>
          )}
          {step === 1 && (
            <label className="block space-y-3">
              <span className="text-sm font-medium text-brand-text">{t('diagnosis.symptomsLabel')}</span>
              <textarea
                className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60 dark:border-brand-secondary/50 dark:bg-brand-surface/60 dark:text-brand-text"
                rows={3}
                {...form.register('symptomsText')}
                placeholder={t('diagnosis.symptomsPlaceholder', 'Saisissez des symptômes, séparés par des virgules…') ?? ''}
              />
              {form.formState.errors.symptomsText && (
                <span className="text-sm text-brand-danger">{form.formState.errors.symptomsText.message}</span>
              )}
            </label>
          )}
          {step === 2 && (
            <label className="block space-y-3">
              <span className="text-sm font-medium text-brand-text">{t('diagnosis.contextLabel')}</span>
              <textarea
                className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60 dark:border-brand-secondary/50 dark:bg-brand-surface/60 dark:text-brand-text"
                rows={4}
                {...form.register('context')}
                placeholder={t('diagnosis.contextPlaceholder') ?? ''}
              />
              {form.formState.errors.context && (
                <span className="text-sm text-brand-danger">{form.formState.errors.context.message}</span>
              )}
            </label>
          )}
        </form>
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 0}
            className="w-full motion-safe:hover:-translate-y-0.5 sm:w-auto"
          >
            {t('common.back')}
          </Button>
          <Button
            onClick={goNext}
            isLoading={isSubmitting}
            disabled={step === steps.length - 1 && files.length === 0}
            className="w-full motion-safe:hover:-translate-y-0.5 sm:w-auto"
          >
            {step === steps.length - 1 ? t('diagnosis.submit') : t('common.continue')}
          </Button>
        </footer>
      </Card>
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-brand-danger/40 bg-brand-danger/10 p-4 text-sm text-brand-danger shadow-sm"
        >
          {error}
        </p>
      )}
      {result && <DiagnosisResultPanel result={result} />}
    </div>
  );
};

export default GuidedScanForm;
