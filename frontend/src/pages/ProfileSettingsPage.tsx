import ProfileSettingsPanel from '@/features/settings/components/ProfileSettingsPanel';
import type { ProfileUpdate, UserProfile } from '@/features/profile/types/profile';

type ProfileSettingsPageProps = {
  profile: UserProfile | null;
  greetingName: string;
  userEmail: string;
  onUpdate: (payload: ProfileUpdate) => Promise<void>;
};

const ProfileSettingsPage = ({ profile, greetingName, userEmail, onUpdate }: ProfileSettingsPageProps) => {
  return <ProfileSettingsPanel profile={profile} onUpdate={onUpdate} greetingName={greetingName} userEmail={userEmail} />;
};

export default ProfileSettingsPage;
