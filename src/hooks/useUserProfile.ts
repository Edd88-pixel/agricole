import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { OnboardingPayload, ProfileUpdate, SupportedLocale, UserProfile } from '@/features/profile/types/profile';
import { createProfile, fetchProfile, saveOnboardingProfile, updateProfile } from '@/services/supabase/profile';
import { createSignedProfileUrl } from '@/services/supabase/storage';

type ProfileState = {
  profile: UserProfile | null;
  isLoading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  updateLocale: (locale: SupportedLocale) => Promise<void>;
  updateProfileDetails: (payload: ProfileUpdate) => Promise<void>;
};

const inferDisplayName = (user: User) =>
  (user.user_metadata?.full_name as string | undefined)?.trim() ||
  (user.email ? user.email.split('@')[0] ?? user.email : 'Producer');

const inferNames = (user: User) => {
  const metaFirst = (user.user_metadata?.first_name as string | undefined)?.trim();
  const metaLast = (user.user_metadata?.last_name as string | undefined)?.trim();
  if (metaFirst || metaLast) {
    return {
      firstName: metaFirst ?? undefined,
      lastName: metaLast ?? undefined
    };
  }

  const display = inferDisplayName(user);
  const parts = display.split(' ');
  if (parts.length === 1) {
    return { firstName: display || undefined, lastName: undefined };
  }

  const [first, ...rest] = parts;
  return {
    firstName: first || undefined,
    lastName: rest.join(' ').trim() || undefined
  };
};

const decorateProfile = async (profile: UserProfile): Promise<UserProfile> => {
  if (!profile.avatarPath) {
    return { ...profile, avatarUrl: undefined };
  }

  try {
    const signed = await createSignedProfileUrl(profile.avatarPath);
    return { ...profile, avatarUrl: signed };
  } catch (error) {
    console.error('Unable to sign profile avatar', error);
    return { ...profile, avatarUrl: undefined };
  }
};

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
        const names = inferNames(user);
        data = await createProfile({
          id: user.id,
          email: user.email ?? undefined,
          displayName: inferDisplayName(user),
          firstName: names.firstName,
          lastName: names.lastName,
          locale: inferLocale(user),
          onboardingCompleted: false,
          crops: []
        });
      }
      const decorated = await decorateProfile(data);
      setProfile(decorated);
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

  const updateProfileDetails = useCallback(
    async (payload: ProfileUpdate) => {
      if (!user) return;
      const updated = await updateProfile(user.id, payload);
      const decorated = await decorateProfile(updated);
      setProfile(decorated);
    },
    [user]
  );

  const updateLocale = useCallback(
    async (locale: SupportedLocale) => {
      await updateProfileDetails({ locale });
    },
    [updateProfileDetails]
  );

  return useMemo(
    () => ({ profile, isLoading, error, refresh, completeOnboarding, updateLocale, updateProfileDetails }),
    [completeOnboarding, error, isLoading, profile, refresh, updateLocale, updateProfileDetails]
  );
};

export type UseUserProfileReturn = ReturnType<typeof useUserProfile>;
