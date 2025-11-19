import { useTranslation } from 'react-i18next';

type ThemeOption = 'light' | 'dark' | 'system';

type Props = {
  value: ThemeOption;
  onChange: (theme: ThemeOption) => void;
};

const labels: Record<ThemeOption, string> = {
  light: 'common.light',
  dark: 'common.dark',
  system: 'common.system'
};

const ThemeSelector = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  return (
    <label className="flex items-center gap-2 text-sm text-brand-muted">
      <span className="sr-only">{t('common.theme')}</span>
      <select
        className="focus-ring rounded-full border border-subtle bg-brand-surface px-3 py-1 text-brand-text shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as ThemeOption)}
        aria-label={t('common.theme') ?? 'Theme'}
      >
        {(Object.keys(labels) as ThemeOption[]).map((option) => (
          <option key={option} value={option}>
            {t(labels[option])}
          </option>
        ))}
      </select>
    </label>
  );
};

export default ThemeSelector;
