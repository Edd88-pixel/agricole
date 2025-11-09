import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { ProfileUpdate, UserProfile } from '@/features/profile/types/profile';
import { uploadProfileAvatar, removeProfileAvatar, createSignedProfileUrl } from '@/services/supabase/storage';

type Props = {
  profile: UserProfile | null;
  onUpdate: (payload: ProfileUpdate) => Promise<void>;
  greetingName: string;
  userEmail: string;
};

const ProfileSettingsPanel = ({ profile, onUpdate, greetingName, userEmail }: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarPath, setAvatarPath] = useState<string | undefined>(undefined);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarCleared, setAvatarCleared] = useState(false);
  const [removedAvatarPath, setRemovedAvatarPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setAvatarPath(profile?.avatarPath);
    setAvatarUrl(profile?.avatarUrl);
    setPendingFile(null);
    setAvatarCleared(false);
    setRemovedAvatarPath(null);
  }, [profile?.avatarPath, profile?.avatarUrl, profile?.firstName, profile?.lastName]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setAvatarCleared(false);
  };

  const resetStatus = () => {
    setStatus(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!profile) return;
    resetStatus();
    setIsSaving(true);

    try {
      const updates: ProfileUpdate = {};
      const fullName = `${firstName} ${lastName}`.trim();
      updates.firstName = firstName.trim() || undefined;
      updates.lastName = lastName.trim() || undefined;
      updates.displayName = fullName.length > 0 ? fullName : profile.displayName;

      let newAvatarPath = avatarPath;
      const previousAvatarPath = profile.avatarPath;
      if (pendingFile) {
        newAvatarPath = await uploadProfileAvatar(pendingFile);
        const signed = await createSignedProfileUrl(newAvatarPath);
        setAvatarUrl(signed);
        updates.avatarPath = newAvatarPath;
        setAvatarCleared(false);
        setRemovedAvatarPath(previousAvatarPath ?? null);
      } else if (avatarCleared) {
        newAvatarPath = undefined;
        updates.avatarPath = null;
      }

      await onUpdate(updates);

      if (pendingFile && removedAvatarPath && removedAvatarPath !== newAvatarPath) {
        await removeProfileAvatar(removedAvatarPath);
      }
      if (avatarCleared && removedAvatarPath) {
        await removeProfileAvatar(removedAvatarPath);
      }

      setAvatarPath(newAvatarPath);
      setPendingFile(null);
      setAvatarCleared(false);
      setRemovedAvatarPath(null);
      setStatus(t('settings.profileSaved'));
    } catch (updateError) {
      console.error('Unable to save profile settings', updateError);
      setError(t('settings.profileSaveError'));
      if (pendingFile && avatarPath && avatarUrl?.startsWith('blob:')) {
        setAvatarUrl(undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <Card className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
          {t('settings.profileHeader')}
        </p>
        <h2 className="text-2xl font-semibold text-brand-text">
          {t('settings.profileTitle', { name: greetingName })}
        </h2>
        <p className="text-sm text-brand-muted">{userEmail}</p>
      </header>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-brand-secondary/30 bg-brand-background text-3xl font-semibold text-brand-secondary">
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('common.profileAvatarAlt') ?? 'Avatar'} className="h-full w-full object-cover" />
              ) : (
                greetingName.charAt(0).toUpperCase()
              )}
            </span>
            <button
              type="button"
              onClick={openFilePicker}
              className="focus-ring absolute -bottom-2 right-0 rounded-full bg-brand-primary p-2 text-white shadow-lg"
              aria-label={t('settings.changeAvatar') ?? 'Change avatar'}
            >
              ✨
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="ghost"
            onClick={() => {
              setPendingFile(null);
              setAvatarUrl(undefined);
              setAvatarPath(undefined);
              setAvatarCleared(true);
              setRemovedAvatarPath(profile?.avatarPath ?? avatarPath ?? null);
            }}
          >
            {t('settings.removeAvatar')}
          </Button>
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-brand-text">{t('settings.firstName')}</span>
              <input
                className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-3 text-sm shadow-inner"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-brand-text">{t('settings.lastName')}</span>
              <input
                className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-3 text-sm shadow-inner"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>
          <p className="rounded-2xl border border-subtle bg-brand-background/60 p-4 text-sm text-brand-muted">
            {t('settings.profileHint')}
          </p>
        </div>
      </div>
      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs uppercase tracking-wide text-brand-muted">{t('settings.profileInfoSaved')}</div>
        <div className="flex items-center gap-3">
          {status && <span className="animate-pulse text-sm text-brand-secondary">{status}</span>}
          {error && <span className="animate-pulse text-sm text-brand-danger">{error}</span>}
          <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
            {t('common.save')}
          </Button>
        </div>
      </footer>
    </Card>
  );
};

export default ProfileSettingsPanel;
