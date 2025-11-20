import OnboardingFlow from '@/features/auth/components/OnboardingFlow';
import type { OnboardingPayload } from '@/features/profile/types/profile';

type OnboardingPageProps = {
  onComplete: (values: OnboardingPayload) => Promise<void>;
};

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
      <OnboardingFlow onComplete={onComplete} />
    </div>
  );
};

export default OnboardingPage;
