import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/app/providers/ThemeProvider';
import { supportedLanguages } from '@/app/i18n';

type Props = {
  language: string;
  onChangeLanguage: (value: string) => Promise<void> | void;
};

const PreferencesPanel = ({ language, onChangeLanguage }: Props) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-text">{t('settings.preferences')}</h2>
        <p className="text-sm text-brand-muted">{t('settings.notifications')}</p>
      </div>
      <div className="space-y-4">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-brand-text">{t('settings.language')}</h3>
          <div className="flex flex-wrap gap-2">
            {supportedLanguages.map((lng) => (
              <Button
                key={lng}
                variant={language === lng ? 'primary' : 'secondary'}
                onClick={() => onChangeLanguage(lng)}
              >
                {lng.toUpperCase()}
              </Button>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-brand-text">{t('settings.theme')}</h3>
          <div className="flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as const).map((option) => (
              <Button key={option} variant={theme === option ? 'primary' : 'secondary'} onClick={() => setTheme(option)}>
                {t(`common.${option}`)}
              </Button>
            ))}
          </div>
        </section>
      </div>
      <Button variant="ghost">{t('common.save')}</Button>
    </Card>
  );
};

export default PreferencesPanel;
