import ProfileSettingsPanel from '@/features/settings/components/ProfileSettingsPanel';
import type { UserProfile } from '@/features/profile/types/profile';

type ProfileSettingsPageProps = {
  profile: UserProfile | null;
  greetingName: string;
  userEmail: string;
  onUpdate: (values: Partial<UserProfile>) => Promise<void>;
};

const ProfileSettingsPage = ({ profile, greetingName, userEmail, onUpdate }: ProfileSettingsPageProps) => {
  return <ProfileSettingsPanel profile={profile} onUpdate={onUpdate} greetingName={greetingName} userEmail={userEmail} />;
};

export default ProfileSettingsPage;
