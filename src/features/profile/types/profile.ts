export type SupportedLocale = 'fr' | 'en';

export type UserProfile = {
  id: string;
  email?: string;
  displayName: string;
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
};

export type ProfileInsert = {
  id: string;
  email?: string;
  displayName: string;
  locale: SupportedLocale;
  objectives?: string;
  location?: string;
  crops?: string[];
  onboardingCompleted?: boolean;
};

export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>> & {
  onboardingCompleted?: boolean;
};
