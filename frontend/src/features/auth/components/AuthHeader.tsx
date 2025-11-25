import LanguageSelector from '@/components/ui/LanguageSelector';
import ThemeSelector from '@/components/ui/ThemeSelector';
import type { Theme } from '@/app/providers/ThemeProvider';
import { supportedLanguages } from '@/app/i18n';
import type { TFunction } from 'i18next';

type AuthHeaderProps = {
  t: TFunction;
  language: string;
  onLanguageChange: (lng: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const AuthHeader = ({ t, language, onLanguageChange, theme, onThemeChange }: AuthHeaderProps) => {
  const handleLanguage = (lng: string) => {
    if (supportedLanguages.includes(lng as (typeof supportedLanguages)[number])) {
      onLanguageChange(lng);
    }
  };

  return (
    <header className="mb-8 flex w-full max-w-5xl items-center justify-between text-sm text-brand-muted">
      <span className="font-semibold text-brand-primary">{t('common.brandName')}</span>
      <div className="flex items-center gap-3">
        <LanguageSelector value={language} onChange={handleLanguage} />
        <ThemeSelector value={theme} onChange={onThemeChange} />
      </div>
    </header>
  );
};

export default AuthHeader;
