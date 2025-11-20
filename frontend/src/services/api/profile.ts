import { apiClient } from './client';
import type {
  OnboardingPayload,
  ProfileInsert,
  ProfileUpdate,
  SupportedLocale,
  UserProfile
} from '@/features/profile/types/profile';

const mapRowToProfile = (row: any): UserProfile => ({
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

export const fetchProfile = async (): Promise<UserProfile | null> => {
  const { data } = await apiClient.get<{ data: any | null }>('api/profile');
  return data ? mapRowToProfile(data) : null;
};

export const createProfile = async (payload: ProfileInsert): Promise<UserProfile> => {
  const { data } = await apiClient.post<{ data: any }>('api/profile', payload);
  return mapRowToProfile(data);
};

export const updateProfile = async (payload: ProfileUpdate): Promise<UserProfile> => {
  const { data } = await apiClient.patch<{ data: any }>('api/profile', payload);
  return mapRowToProfile(data);
};

export const saveOnboardingProfile = async (payload: OnboardingPayload): Promise<UserProfile> => {
  const { data } = await apiClient.post<{ data: any }>('api/profile/onboarding', payload);
  return mapRowToProfile(data);
};
