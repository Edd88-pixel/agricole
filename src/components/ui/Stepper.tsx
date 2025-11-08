import { clsx } from 'clsx';

type StepperProps = {
  steps: string[];
  currentStep: number;
};

const Stepper = ({ steps, currentStep }: StepperProps) => (
  <ol className="flex items-center gap-4" aria-label="Progress">
    {steps.map((step, index) => {
      const state = index === currentStep ? 'current' : index < currentStep ? 'complete' : 'upcoming';
      return (
        <li key={step} className="flex items-center gap-3">
          <span
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold',
              state === 'current' && 'border-brand-primary bg-brand-primary text-white',
              state === 'complete' && 'border-brand-accent bg-brand-accent text-white',
              state === 'upcoming' && 'border-subtle text-brand-muted'
            )}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {index + 1}
          </span>
          <span className={clsx('text-sm font-medium', state !== 'upcoming' ? 'text-brand-text' : 'text-brand-muted')}>
            {step}
          </span>
        </li>
      );
    })}
  </ol>
);

export default Stepper;
