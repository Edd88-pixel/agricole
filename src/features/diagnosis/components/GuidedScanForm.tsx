import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import DiagnosisResultPanel from './ResultPanel';
import { runInference } from '../services/inference';
import type { DiagnosisResult } from '../types/diagnosis';

const schema = z.object({
  crop: z.string().min(2),
  stage: z.string().min(2),
  symptoms: z.array(z.string()).min(1),
  context: z.string().min(3)
});

type FormValues = z.infer<typeof schema>;

const steps: (keyof FormValues)[] = ['crop', 'symptoms', 'context'];

const optionKeys = {
  crop: ['domain.crops.maize', 'domain.crops.wheat', 'domain.crops.cotton', 'domain.crops.rice'] as const,
  stage: ['domain.stages.sowing', 'domain.stages.vegetative', 'domain.stages.flowering', 'domain.stages.harvest'] as const,
  symptoms: [
    'domain.symptoms.leafSpots',
    'domain.symptoms.necrosis',
    'domain.symptoms.chlorosis',
    'domain.symptoms.insectsVisible'
  ] as const
};

type GuidedProps = {
  onResult?: (result: DiagnosisResult) => void;
};

const GuidedScanForm = ({ onResult }: GuidedProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { crop: '', stage: '', symptoms: [], context: '' }
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
          const inference = await runInference({ ...values, files: [] });
          setResult(inference);
          onResult?.(inference);
        } catch (submissionError) {
          console.error('Guided scan submission failed', submissionError);
          setError(t('diagnosis.errorGeneral'));
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
      <Card className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-brand-text">{t('dashboard.guidedScan')}</h1>
          <Stepper steps={labels} currentStep={step} />
        </header>
        <form className="space-y-5">
          {step === 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-3">
                <span className="text-sm font-medium text-brand-text">{t('diagnosis.cropLabel')}</span>
                <select
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
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
                  className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
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
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-brand-text">{t('diagnosis.symptomsLabel')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {optionKeys.symptoms.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-3xl border border-brand-secondary/20 bg-white/70 p-4 shadow-sm"
                  >
                    <input
                      type="checkbox"
                      value={t(key)}
                      className="h-5 w-5 rounded border-brand-secondary/40 text-brand-primary focus:ring-brand-primary"
                      {...form.register('symptoms')}
                    />
                    <span className="text-sm">{t(key)}</span>
                  </label>
                ))}
              </div>
              {form.formState.errors.symptoms && (
                <span className="text-sm text-brand-danger">{form.formState.errors.symptoms.message}</span>
              )}
            </fieldset>
          )}
          {step === 2 && (
            <label className="block space-y-3">
              <span className="text-sm font-medium text-brand-text">{t('diagnosis.contextLabel')}</span>
              <textarea
                className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
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
          <Button variant="ghost" onClick={goBack} disabled={step === 0}>
            {t('common.back')}
          </Button>
          <Button onClick={goNext} isLoading={isSubmitting}>
            {step === steps.length - 1 ? t('diagnosis.submit') : t('common.continue')}
          </Button>
        </footer>
      </Card>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-brand-danger bg-brand-danger/10 p-3 text-sm text-brand-danger"
        >
          {error}
        </p>
      )}
      {result && <DiagnosisResultPanel result={result} />}
    </div>
  );
};

export default GuidedScanForm;
