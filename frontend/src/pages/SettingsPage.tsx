import PreferencesPanel from '@/features/settings/components/PreferencesPanel';
import ProfileSettingsPanel from '@/features/settings/components/ProfileSettingsPanel';
import type { UserProfile } from '@/features/profile/types/profile';

type SettingsPageProps = {
  profile: UserProfile | null;
  greetingName: string;
  userEmail: string;
  language: string;
  onChangeLanguage: (lng: string) => Promise<void>;
  onUpdate: (values: Partial<UserProfile>) => Promise<void>;
};

const SettingsPage = ({ profile, greetingName, userEmail, language, onChangeLanguage, onUpdate }: SettingsPageProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <ProfileSettingsPanel profile={profile} onUpdate={onUpdate} greetingName={greetingName} userEmail={userEmail} />
      <PreferencesPanel language={language} onChangeLanguage={onChangeLanguage} />
    </div>
  );
};

export default SettingsPage;
