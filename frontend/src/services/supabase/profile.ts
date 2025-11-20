import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import type {
  OnboardingPayload,
  ProfileInsert,
  ProfileUpdate,
  SupportedLocale,
  UserProfile
} from '@/features/profile/types/profile';

const TABLE = 'users_profiles';

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  locale: string | null;
  objectives: string | null;
  location: string | null;
  crops: string[] | null;
  onboarding_completed: boolean | null;
  created_at: string;
};

const mapRowToProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email ?? undefined,
  displayName: row.display_name ?? '',
  firstName: row.first_name ?? undefined,
  lastName: row.last_name ?? undefined,
  avatarPath: row.avatar_path ?? undefined,
  locale: (row.locale as SupportedLocale) ?? 'fr',
  objectives: row.objectives ?? undefined,
  location: row.location ?? undefined,
  crops: row.crops ?? [],
  onboardingCompleted: Boolean(row.onboarding_completed),
  createdAt: row.created_at
});

const ensurePostgrest = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

const normaliseInsert = (payload: ProfileInsert) => ({
  id: payload.id,
  email: payload.email ?? null,
  display_name: payload.displayName,
  first_name: payload.firstName ?? null,
  last_name: payload.lastName ?? null,
  avatar_path: payload.avatarPath ?? null,
  locale: payload.locale,
  objectives: payload.objectives ?? null,
  location: payload.location ?? null,
  crops: payload.crops ?? [],
  onboarding_completed: payload.onboardingCompleted ?? false
});

const normaliseUpdate = (payload: ProfileUpdate) => {
  const entries: [string, unknown][] = [];

  if (payload.email !== undefined) entries.push(['email', payload.email ?? null]);
  if (payload.displayName !== undefined) entries.push(['display_name', payload.displayName]);
  if (payload.firstName !== undefined) entries.push(['first_name', payload.firstName ?? null]);
  if (payload.lastName !== undefined) entries.push(['last_name', payload.lastName ?? null]);
  if (payload.avatarPath !== undefined) entries.push(['avatar_path', payload.avatarPath ?? null]);
  if (payload.locale !== undefined) entries.push(['locale', payload.locale]);
  if (payload.objectives !== undefined) entries.push(['objectives', payload.objectives ?? null]);
  if (payload.location !== undefined) entries.push(['location', payload.location ?? null]);
  if (payload.crops !== undefined) entries.push(['crops', payload.crops ?? []]);
  if (payload.onboardingCompleted !== undefined)
    entries.push(['onboarding_completed', payload.onboardingCompleted]);

  return Object.fromEntries(entries);
};

export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();

  ensurePostgrest(error);

  if (!data) {
    return null;
  }

  return mapRowToProfile(data);
};

export const createProfile = async (payload: ProfileInsert): Promise<UserProfile> => {
  const insertPayload = normaliseInsert(payload);

  const { data, error } = await supabase
    .from(TABLE)
    .insert(insertPayload)
    .select()
    .single<ProfileRow>();

  ensurePostgrest(error);

  if (!data) {
    throw new Error('Profile insert returned no data');
  }

  return mapRowToProfile(data);
};

export const updateProfile = async (userId: string, payload: ProfileUpdate): Promise<UserProfile> => {
  const updateData = normaliseUpdate(payload);

  if (Object.keys(updateData).length === 0) {
    const existing = await fetchProfile(userId);
    if (!existing) {
      throw new Error('Profile not found for update');
    }
    return existing;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', userId)
    .select()
    .single<ProfileRow>();

  ensurePostgrest(error);

  if (!data) {
    throw new Error('Profile update returned no data');
  }

  return mapRowToProfile(data);
};

export const saveOnboardingProfile = async (
  userId: string,
  payload: OnboardingPayload
): Promise<UserProfile> =>
  updateProfile(userId, {
    objectives: payload.objectives,
    location: payload.location,
    crops: payload.crops,
    onboardingCompleted: true
  });
