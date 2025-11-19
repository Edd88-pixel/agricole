import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './messages/en';
import fr from './messages/fr';

export const supportedLanguages = ['fr', 'en'] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: { translation: en },
  fr: { translation: fr }
} as const;

const fallbackLng: SupportedLanguage = 'en';

export const initI18n = () => {
  if (!i18n.isInitialized) {
    void i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'fr',
        fallbackLng,
        supportedLngs: supportedLanguages,
        interpolation: { escapeValue: false },
        returnNull: false
      });
  }
};

export default i18n;
