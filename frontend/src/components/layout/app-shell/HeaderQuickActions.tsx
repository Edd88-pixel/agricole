import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import LanguageSelector from '@/components/ui/LanguageSelector';
import ThemeSelector from '@/components/ui/ThemeSelector';
import type { Theme } from '@/app/providers/ThemeProvider';

type HeaderQuickActionsProps = {
  language: string;
  onLanguageChange: (language: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const HeaderQuickActions = ({ language, onLanguageChange, theme, onThemeChange }: HeaderQuickActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="hidden items-center gap-4 md:flex">
      <LanguageSelector value={language} onChange={onLanguageChange} />
      <ThemeSelector value={theme} onChange={onThemeChange} />
      <Button variant="secondary" asChild to="/diagnosis/quick">
        {t('dashboard.createDiagnosis')}
      </Button>
    </div>
  );
};

export default memo(HeaderQuickActions);
