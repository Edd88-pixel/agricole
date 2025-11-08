import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { OnboardingPayload, SupportedLocale, UserProfile } from '@/features/profile/types/profile';
import { createProfile, fetchProfile, saveOnboardingProfile, updateProfile } from '@/services/supabase/profile';

type ProfileState = {
  profile: UserProfile | null;
  isLoading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  updateLocale: (locale: SupportedLocale) => Promise<void>;
};

const inferDisplayName = (user: User) =>
  (user.user_metadata?.full_name as string | undefined)?.trim() ||
  (user.email ? user.email.split('@')[0] ?? user.email : 'Producer');

const inferLocale = (user: User): SupportedLocale => {
  const candidate = (user.user_metadata?.locale as string | undefined)?.slice(0, 2)?.toLowerCase();
  if (candidate === 'en' || candidate === 'fr') {
    return candidate;
  }
  return 'fr';
};

export const useUserProfile = (user: User | null | undefined): ProfileState => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(user));
  const [error, setError] = useState<Error>();

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      let data = await fetchProfile(user.id);
      if (!data) {
        data = await createProfile({
          id: user.id,
          email: user.email ?? undefined,
          displayName: inferDisplayName(user),
          locale: inferLocale(user),
          onboardingCompleted: false,
          crops: []
        });
      }
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(
    async (payload: OnboardingPayload) => {
      if (!user) return;
      const updated = await saveOnboardingProfile(user.id, payload);
      setProfile(updated);
    },
    [user]
  );

  const updateLocale = useCallback(
    async (locale: SupportedLocale) => {
      if (!user) return;
      const updated = await updateProfile(user.id, { locale });
      setProfile(updated);
    },
    [user]
  );

  return useMemo(
    () => ({ profile, isLoading, error, refresh, completeOnboarding, updateLocale }),
    [completeOnboarding, error, isLoading, profile, refresh, updateLocale]
  );
};

export type UseUserProfileReturn = ReturnType<typeof useUserProfile>;
