import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { TFunction } from 'i18next';
import { Link } from 'react-router-dom';

const features = [
  { icon: '✅', key: 'auth.featurePrivacy' },
  { icon: '🔒', key: 'auth.featureSecurity' },
  { icon: '🛰️', key: 'auth.featureEdge' }
] as const;

type AuthHeroProps = {
  t: TFunction;
};

const AuthHero = ({ t }: AuthHeroProps) => (
  <Card className="relative overflow-hidden p-10">
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-primary/15 via-brand-accent/10 to-brand-secondary/15" />
    <div className="space-y-6">
      <p className="inline-flex items-center rounded-full bg-brand-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary">
        {t('auth.guardianTagline')}
      </p>
      <h1 className="text-3xl font-semibold text-brand-text dark:text-white">{t('auth.heroTitle')}</h1>
      <p className="text-base leading-relaxed text-brand-muted">{t('auth.heroSubtitle')}</p>
      <div className="grid gap-4 text-sm text-brand-text">
        <Card className="border border-brand-primary/40 bg-white/70 p-6 hover:translate-y-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-brand-primary">
              <span aria-hidden>⚡</span>
              {t('dashboard.quickScan')}
            </div>
            <p className="text-brand-muted">{t('dashboard.quickScanDescription')}</p>
            <Button asChild size="lg" className="w-fit">
              <Link to="/diagnosis/quick">{t('dashboard.quickScan')}</Link>
            </Button>
          </div>
        </Card>
        <Card className="border border-brand-secondary/40 bg-white/70 p-6 hover:translate-y-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-brand-secondary">
              <span aria-hidden>🧭</span>
              {t('dashboard.guidedScan')}
            </div>
            <p className="text-brand-muted">{t('dashboard.guidedScanDescription')}</p>
            <Button variant="secondary" asChild size="lg" className="w-fit">
              <Link to="/diagnosis/guided">{t('dashboard.guidedScan')}</Link>
            </Button>
          </div>
        </Card>
      </div>
      <ul className="space-y-3 text-sm text-brand-muted" role="list">
        {features.map(({ icon, key }) => (
          <li key={key} className="flex items-center gap-2">
            <span aria-hidden>{icon}</span>
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

export default AuthHero;
