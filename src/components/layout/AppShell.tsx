import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/ThemeProvider';
import { supportedLanguages } from '@/app/i18n';
import Button from '@/components/ui/Button';
import LanguageSelector from '@/components/ui/LanguageSelector';
import ThemeSelector from '@/components/ui/ThemeSelector';

const navigation = [
  { to: '/dashboard', icon: '🌱', labelKey: 'dashboard.dashboard' },
  { to: '/diagnosis/quick', icon: '⚡', labelKey: 'dashboard.quickScan' },
  { to: '/diagnosis/guided', icon: '🧭', labelKey: 'dashboard.guidedScan' },
  { to: '/history', icon: '🗂️', labelKey: 'dashboard.history' },
  { to: '/knowledge-base', icon: '📚', labelKey: 'dashboard.knowledgeBase' },
  { to: '/settings', icon: '⚙️', labelKey: 'dashboard.settings' }
];

type AppShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  onSignOut: () => Promise<void> | void;
};

const AppShell = ({ children, userName, userEmail, onSignOut }: AppShellProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    if (supportedLanguages.includes(lng as (typeof supportedLanguages)[number])) {
      void i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-background via-white to-brand-background text-brand-text transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
      <header className="border-b border-subtle/60 bg-brand-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="focus-ring rounded-md p-2 text-2xl lg:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <Link to="/dashboard" className="text-lg font-semibold text-brand-primary">
              {t('common.brandName')}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector value={i18n.language} onChange={changeLanguage} />
            <ThemeSelector value={theme} onChange={setTheme} />
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-brand-text dark:text-white">{userName}</p>
              <p className="text-xs text-brand-muted">{userEmail}</p>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/diagnosis/quick">{t('dashboard.createDiagnosis')}</Link>
            </Button>
            <Button variant="ghost" onClick={onSignOut} className="hidden md:inline-flex">
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </header>
      <Transition show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileOpen}>
          <Transition.Child
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="duration-200 ease-out"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="duration-150 ease-in"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col gap-y-6 bg-brand-surface p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <Link to="/dashboard" className="text-lg font-semibold text-brand-primary">
                    {t('common.brandName')}
                  </Link>
                  <button type="button" className="focus-ring rounded-md p-2" onClick={() => setMobileOpen(false)}>
                    ✕
                  </button>
                </div>
                <nav className="flex flex-col gap-3">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium focus-ring ${
                          isActive ? 'bg-brand-primary text-white' : 'text-brand-text hover:bg-brand-background'
                        }`
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <span aria-hidden>{item.icon}</span>
                      <span>{t(item.labelKey)}</span>
                    </NavLink>
                  ))}
                </nav>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setMobileOpen(false);
                    await onSignOut();
                  }}
                >
                  {t('common.signOut')}
                </Button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium focus-ring ${
                    isActive ? 'bg-brand-primary text-white shadow-card' : 'text-brand-text hover:bg-brand-background'
                  }`
                }
              >
                <span aria-hidden>{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 space-y-8 pb-20">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
