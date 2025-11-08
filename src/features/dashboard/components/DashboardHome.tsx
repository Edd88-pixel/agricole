import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checklist from '@/components/ui/Checklist';
import Skeleton from '@/components/ui/Skeleton';
import type { HistoryEntry } from '@/features/history/types/history';

type Props = {
  userName: string;
  recent: HistoryEntry[];
  isLoading?: boolean;
};

const DashboardHome = ({ userName, recent, isLoading }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-semibold text-brand-text">{t('dashboard.welcome', { name: userName })}</h1>
          <p className="text-sm text-brand-muted">
            {t('dashboard.createDiagnosis')}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="border border-brand-primary/30 bg-white/80 p-6 hover:translate-y-0">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-3 text-lg font-semibold text-brand-primary">
                    <span aria-hidden>⚡</span>
                    {t('dashboard.quickScan')}
                  </div>
                  <p className="mt-2 text-sm text-brand-muted">{t('dashboard.quickScanDescription')}</p>
                </div>
                <Button asChild size="lg">
                  <Link to="/diagnosis/quick">{t('dashboard.quickScan')}</Link>
                </Button>
              </div>
            </Card>
            <Card className="border border-brand-secondary/30 bg-white/80 p-6 hover:translate-y-0">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-3 text-lg font-semibold text-brand-secondary">
                    <span aria-hidden>🧭</span>
                    {t('dashboard.guidedScan')}
                  </div>
                  <p className="mt-2 text-sm text-brand-muted">{t('dashboard.guidedScanDescription')}</p>
                </div>
                <Button variant="secondary" asChild size="lg">
                  <Link to="/diagnosis/guided">{t('dashboard.guidedScan')}</Link>
                </Button>
              </div>
            </Card>
          </div>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-text">{t('dashboard.knowledgeBase')}</h2>
          <p className="mt-2 text-sm text-brand-muted">📚</p>
          <Button className="mt-4" variant="ghost" asChild>
            <Link to="/knowledge-base">{t('dashboard.knowledgeBase')}</Link>
          </Button>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-text">{t('dashboard.history')}</h2>
            <Button variant="ghost" asChild>
              <Link to="/history">{t('dashboard.history')}</Link>
            </Button>
          </header>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-brand-muted">{t('history.empty')}</p>
          ) : (
            <ul className="space-y-3" role="list">
              {recent.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-2 rounded-xl border border-subtle bg-brand-surface p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{entry.primary.label}</p>
                    <p className="text-xs text-brand-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <Link className="text-sm font-semibold text-brand-secondary" to={`/history/${entry.id}`}>
                    {t('dashboard.history')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-text">{t('common.actions')}</h2>
          <Checklist
            items={[
              { id: 'quality', label: t('dashboard.checklistQuality') },
              { id: 'upload', label: t('dashboard.checklistUpload') },
              { id: 'prevent', label: t('dashboard.checklistFollowup') }
            ]}
          />
        </Card>
      </section>
    </div>
  );
};

export default DashboardHome;
