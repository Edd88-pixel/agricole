import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

// Les symptômes sont désormais saisis librement dans un champ texte

type QuickScanProps = {
  onResult?: (result: DiagnosisResult) => void;
};

const QuickScanForm = ({ onResult }: QuickScanProps) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { crop: '', stage: '', symptomsText: '', context: '' }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);
    try {
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
      console.error('Quick scan submission failed', submissionError);
      setError(t('diagnosis.errorGeneral'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="space-y-8">
      <Card className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-brand-text">{t('dashboard.quickScan')}</h1>
          <p className="text-base text-brand-muted">{t('diagnosis.uploadHint')}</p>
        </header>
        <UploadZone files={files} onChange={setFiles} />
        <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('diagnosis.cropLabel')}</span>
            <input
              className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              {...form.register('crop')}
              placeholder={t('diagnosis.cropPlaceholder') ?? ''}
            />
            {form.formState.errors.crop && (
              <span className="text-sm text-brand-danger">{form.formState.errors.crop.message}</span>
            )}
          </label>
          <label className="space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('diagnosis.stageLabel')}</span>
            <input
              className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              {...form.register('stage')}
              placeholder={t('diagnosis.stagePlaceholder') ?? ''}
            />
            {form.formState.errors.stage && (
              <span className="text-sm text-brand-danger">{form.formState.errors.stage.message}</span>
            )}
          </label>
          <label className="space-y-3 md:col-span-2">
            <span className="text-sm font-medium text-brand-text">{t('diagnosis.symptomsLabel')}</span>
            <textarea
              className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              rows={2}
              {...form.register('symptomsText')}
              placeholder={t('diagnosis.symptomsPlaceholder', 'Saisissez des symptômes, séparés par des virgules…') ?? ''}
            />
            {form.formState.errors.symptomsText && (
              <span className="text-sm text-brand-danger">{form.formState.errors.symptomsText.message}</span>
            )}
          </label>
          <label className="md:col-span-2 space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('diagnosis.contextLabel')}</span>
            <textarea
              className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              rows={3}
              {...form.register('context')}
              placeholder={t('diagnosis.contextPlaceholder') ?? ''}
            />
            {form.formState.errors.context && (
              <span className="text-sm text-brand-danger">{form.formState.errors.context.message}</span>
            )}
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={files.length === 0}>
              {t('diagnosis.submit')}
            </Button>
          </div>
        </form>
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

export default QuickScanForm;
