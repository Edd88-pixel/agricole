import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import type { OnboardingPayload } from '@/features/profile/types/profile';

const schema = z.object({
  objectives: z.string().min(3),
  location: z.string().min(2),
  cropsText: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

const stepsKeys: (keyof FormValues)[] = ['objectives', 'location', 'cropsText'];

type Props = {
  onComplete: (values: OnboardingPayload) => Promise<void>;
};

const OnboardingFlow = ({ onComplete }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { objectives: '', location: '', cropsText: '' }
  });

  const stepperLabels = [
    t('auth.objectivesStep'),
    t('auth.locationStep'),
    t('auth.cropsStep')
  ];

  const goNext = async () => {
    const key = stepsKeys[step];
    const isValid = await form.trigger(key);
    if (isValid) {
      if (step === stepsKeys.length - 1) {
        try {
          setIsSubmitting(true);
          const values = form.getValues();
          const crops = values.cropsText
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          await onComplete({ objectives: values.objectives, location: values.location, crops });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <Card className="mx-auto max-w-3xl space-y-10 border-brand-primary/40 bg-white/80 p-10 shadow-card backdrop-blur">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
          {t('auth.onboardingTitle')}
        </p>
        <Stepper steps={stepperLabels} currentStep={step} />
      </header>
      <form className="space-y-6">
        {step === 0 && (
          <label className="block space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('auth.objectivesStep')}</span>
            <textarea
              className="focus-ring min-h-[160px] w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              {...form.register('objectives')}
              placeholder={t('auth.objectivesPlaceholder') ?? ''}
            />
            {form.formState.errors.objectives && (
              <p className="text-sm text-brand-danger">{form.formState.errors.objectives.message}</p>
            )}
          </label>
        )}
        {step === 1 && (
          <label className="block space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('auth.locationStep')}</span>
            <input
              className="focus-ring w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              {...form.register('location')}
              placeholder={t('auth.locationPlaceholder') ?? ''}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-brand-danger">{form.formState.errors.location.message}</p>
            )}
          </label>
        )}
        {step === 2 && (
          <label className="block space-y-3">
            <span className="text-sm font-medium text-brand-text">{t('auth.cropsStep')}</span>
            <textarea
              className="focus-ring min-h-[120px] w-full rounded-3xl border border-brand-secondary/30 bg-white/70 p-4 text-sm shadow-inner"
              {...form.register('cropsText')}
              placeholder={t('auth.cropsPlaceholder', 'Listez vos cultures, séparées par des virgules') ?? ''}
            />
            {form.formState.errors.cropsText && (
              <p className="text-sm text-brand-danger">{form.formState.errors.cropsText.message}</p>
            )}
          </label>
        )}
      </form>
      <footer className="flex items-center justify-between">
        <Button variant="ghost" type="button" onClick={goBack} disabled={step === 0 || isSubmitting}>
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              try {
                setIsSubmitting(true);
                const values = form.getValues();
                const crops = values.cropsText
                  .split(/[,;\n]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                await onComplete({ objectives: values.objectives, location: values.location, crops });
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {t('auth.skip')}
          </Button>
          <Button type="button" onClick={goNext} isLoading={isSubmitting}>
            {step === stepsKeys.length - 1 ? t('auth.finish') : t('common.continue')}
          </Button>
        </div>
      </footer>
    </Card>
  );
};

export default OnboardingFlow;
