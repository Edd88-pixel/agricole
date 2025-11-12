import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
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
    <div className="space-y-8">
      <Card className="space-y-8 border border-subtle/70 bg-brand-surface/90">
        <header className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl font-semibold text-brand-text">{t('dashboard.guidedScan')}</h1>
            <span className="rounded-full border border-brand-secondary/30 bg-brand-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-secondary shadow-sm">
              {t('diagnosis.uploadTitle')}
            </span>
          </div>
          <Stepper steps={labels} currentStep={step} />
        </header>
        <UploadZone files={files} onChange={setFiles} />
        <form className="space-y-6">
          {step === 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-3">
                <span className="text-sm font-medium text-brand-text">{t('diagnosis.cropLabel')}</span>
                <select
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60"
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
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60"
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
                className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60"
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
                className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/80 p-4 text-sm shadow-inner transition hover:border-brand-secondary/60"
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
        <footer className="flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} disabled={step === 0} className="motion-safe:hover:-translate-y-0.5">
            {t('common.back')}
          </Button>
          <Button
            onClick={goNext}
            isLoading={isSubmitting}
            disabled={step === steps.length - 1 && files.length === 0}
            className="motion-safe:hover:-translate-y-0.5"
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
