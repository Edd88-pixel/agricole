import { clsx } from 'clsx';

type StepperProps = {
  steps: string[];
  currentStep: number;
};

const Stepper = ({ steps, currentStep }: StepperProps) => (
  <ol className="relative flex items-center gap-6" aria-label="Progress">
    {steps.map((step, index) => {
      const state = index === currentStep ? 'current' : index < currentStep ? 'complete' : 'upcoming';
      return (
        <li key={step} className="relative flex items-center gap-3">
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className={clsx(
                'absolute left-11 top-1/2 hidden h-px w-12 -translate-y-1/2 rounded-full transition-all duration-300 lg:block',
                state === 'complete'
                  ? 'bg-brand-primary'
                  : index < currentStep
                    ? 'bg-brand-primary'
                    : 'bg-brand-muted/40'
              )}
            />
          )}
          <span
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm transition-all duration-300',
              state === 'current' && 'border-brand-primary bg-brand-primary text-white shadow-[0_0_0_6px_rgba(11,110,79,0.18)] motion-safe:animate-[pulse-border_1.6s_ease-in-out_infinite]',
              state === 'complete' && 'border-brand-accent bg-brand-accent text-white',
              state === 'upcoming' && 'border-subtle text-brand-muted bg-brand-background/80'
            )}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {index + 1}
          </span>
          <span
            className={clsx(
              'text-sm font-medium transition-colors duration-300',
              state !== 'upcoming' ? 'text-brand-text' : 'text-brand-muted'
            )}
          >
            {step}
          </span>
        </li>
      );
    })}
  </ol>
);

export default Stepper;
