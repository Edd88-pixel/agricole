import OnboardingFlow from '@/features/auth/components/OnboardingFlow';
import type { OnboardingProfile } from '@/features/profile/types/profile';

type OnboardingPageProps = {
  onComplete: (values: OnboardingProfile) => Promise<void>;
};

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
      <OnboardingFlow onComplete={onComplete} />
    </div>
  );
};

export default OnboardingPage;
