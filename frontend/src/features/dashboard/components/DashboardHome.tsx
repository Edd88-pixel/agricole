import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checklist from '@/components/ui/Checklist';
import Skeleton from '@/components/ui/Skeleton';
import type { HistoryEntry } from '@/features/history/types/history';

type Props = {
  userName: string;
  greetingName?: string;
  recent: HistoryEntry[];
  isLoading?: boolean;
};

const DashboardHome = ({ userName, greetingName, recent, isLoading }: Props) => {
  const { t } = useTranslation();
  const welcomeName = greetingName ?? userName;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 animate-[fade-in-up_0.6s_ease-out] lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2 space-y-6 bg-gradient-to-br from-brand-surface/95 via-white/90 to-brand-surface/90 dark:from-[#0f211b] dark:via-[#0c1a15] dark:to-[#0c221b]">
          <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-secondary/10 blur-3xl" aria-hidden />
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-secondary shadow-sm">
              {t('dashboard.yourAssistant', 'Assistant agronome assisté par IA')}
            </span>
            <h1 className="text-3xl font-semibold text-brand-text sm:text-4xl">
              {t('dashboard.welcome', { name: welcomeName })}
            </h1>
            <p className="max-w-2xl text-sm text-brand-muted">{t('dashboard.createDiagnosis')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="relative overflow-hidden border border-brand-primary/30 bg-white/80 p-6 shadow-inner dark:border-brand-primary/30 dark:bg-brand-surface/90">
              <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent dark:via-brand-primary/20" aria-hidden />
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-lg font-semibold text-brand-primary dark:text-brand-bright">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary/10 text-xl dark:bg-brand-primary/20" aria-hidden>
                      ⚡
                    </span>
                    <span>{t('dashboard.quickScan')}</span>
                  </div>
                  <p className="text-sm text-brand-muted dark:text-brand-muted/90">{t('dashboard.quickScanDescription')}</p>
                </div>
                <Button asChild size="lg" to="/diagnosis/quick">
                  <span>{t('dashboard.quickScan')}</span>
                </Button>
              </div>
            </Card>
            <Card className="relative overflow-hidden border border-brand-secondary/30 bg-white/80 p-6 shadow-inner dark:border-brand-secondary/30 dark:bg-brand-surface/90">
              <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/40 to-transparent dark:via-brand-secondary/20" aria-hidden />
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-lg font-semibold text-brand-secondary dark:text-brand-bright">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-secondary/10 text-xl dark:bg-brand-secondary/20" aria-hidden>
                      🧭
                    </span>
                    <span>{t('dashboard.guidedScan')}</span>
                  </div>
                  <p className="text-sm text-brand-muted dark:text-brand-muted/90">{t('dashboard.guidedScanDescription')}</p>
                </div>
                <Button variant="secondary" asChild size="lg" to="/diagnosis/guided">
                  <span>{t('dashboard.guidedScan')}</span>
                </Button>
              </div>
            </Card>
          </div>
        </Card>
        <Card className="space-y-4 overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-brand-text">{t('dashboard.knowledgeBase')}</h2>
            <p className="text-sm text-brand-muted">{t('dashboard.knowledgeBaseDescription', 'Discutez, cherchez et archivez vos échanges en un seul endroit.')} 📚</p>
          </div>
          <div className="rounded-2xl border border-dashed border-brand-secondary/30 bg-brand-background/60 p-4 text-sm text-brand-muted shadow-inner">
            {t('dashboard.knowledgeBaseHint', 'Partagez des photos à l’assistant pour enrichir vos recherches.')} ✨
          </div>
          <Button className="mt-2" variant="ghost" asChild to="/knowledge-base">
            <span>{t('dashboard.openKnowledgeBase', 'Accéder à la base de connaissances')}</span>
          </Button>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-text">{t('dashboard.history')}</h2>
              <p className="text-sm text-brand-muted">{t('dashboard.historyDescription', 'Retrouvez vos analyses récentes et reprenez le fil en un clin d’œil.')}</p>
            </div>
            <Button variant="ghost" asChild to="/history">
              <span>{t('dashboard.viewAllHistory', 'Voir tout')}</span>
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
                <li
                  key={entry.id}
                  className="group flex flex-col gap-2 rounded-2xl border border-subtle/80 bg-brand-surface/80 p-4 shadow-sm transition-all duration-300 ease-out md:flex-row md:items-center md:justify-between motion-safe:hover:-translate-y-1 motion-safe:hover:border-brand-primary/30 motion-safe:hover:shadow-[0_18px_32px_rgba(11,110,79,0.12)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-secondary opacity-70" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-brand-text">{entry.primary.label}</p>
                      <p className="text-xs text-brand-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Link className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition motion-safe:group-hover:translate-x-1" to={`/history/${entry.id}`}>
                    <span>{t('dashboard.historyOpen', 'Ouvrir')}</span>
                    <span aria-hidden>→</span>
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
