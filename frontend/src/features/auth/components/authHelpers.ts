import type { SupportedLocale } from '@/features/profile/types/profile';

export const normalizeLocale = (lng: string): SupportedLocale => {
  const short = lng.slice(0, 2).toLowerCase();
  return short === 'en' ? 'en' : 'fr';
};

export const buildDisplayName = (firstName: string, lastName: string, email: string): string => {
  const full = `${firstName} ${lastName}`.trim();
  return full || email;
};
