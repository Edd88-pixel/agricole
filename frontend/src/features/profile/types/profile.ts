export type SupportedLocale = 'fr' | 'en';

export type UserProfile = {
  id: string;
  email?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarPath?: string;
  avatarUrl?: string;
  locale: SupportedLocale;
  objectives?: string;
  location?: string;
  crops: string[];
  onboardingCompleted: boolean;
  createdAt?: string;
};

export type OnboardingPayload = {
  objectives: string;
  location: string;
  crops: string[];
  skip?: boolean;
};

export type ProfileInsert = {
  id: string;
  email?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarPath?: string;
  locale: SupportedLocale;
  objectives?: string;
  location?: string;
  crops?: string[];
  onboardingCompleted?: boolean;
};

export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id' | 'avatarPath'>> & {
  avatarPath?: string | null;
  onboardingCompleted?: boolean;
};
