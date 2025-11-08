import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '@/app/i18n';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const LanguageSelector = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  return (
    <label className="flex items-center gap-2 text-sm text-brand-muted">
      <span className="sr-only">{t('common.language')}</span>
      <select
        className="focus-ring rounded-full border border-subtle bg-brand-surface px-3 py-1 text-brand-text shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t('common.language') ?? 'Language'}
      >
        {supportedLanguages.map((lng) => (
          <option key={lng} value={lng}>
            {lng.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
