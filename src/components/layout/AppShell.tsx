import { Fragment, useMemo, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
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
  { to: '/library', icon: '🖼️', labelKey: 'dashboard.mediaLibrary' },
  { to: '/knowledge-base', icon: '📚', labelKey: 'dashboard.knowledgeBase' },
  { to: '/settings', icon: '⚙️', labelKey: 'dashboard.settings' }
];

type AppShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  onSignOut: () => Promise<void> | void;
};

const AppShell = ({ children, userName, userEmail, userAvatar, onSignOut }: AppShellProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItemClasses = useMemo(
    () =>
      ({ isActive }: { isActive: boolean }) =>
        clsx(
          'group relative flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out focus-ring',
          'motion-safe:hover:translate-x-1',
          isActive
            ? 'bg-brand-primary/15 text-brand-primary shadow-[0_18px_36px_rgba(11,110,79,0.18)] dark:bg-brand-primary/20'
            : 'text-brand-muted hover:bg-brand-surface/80 hover:text-brand-text dark:hover:bg-brand-surface/70'
        ),
    []
  );

  const changeLanguage = (lng: string) => {
    if (supportedLanguages.includes(lng as (typeof supportedLanguages)[number])) {
      void i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-brand-background via-white to-brand-background text-brand-text transition-colors dark:from-[#0b1f19] dark:via-[#071410] dark:to-[#0b1f19] dark:text-brand-text">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-32 right-[-140px] h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl opacity-0 md:opacity-80 motion-safe:animate-[float-soft_12s_ease-in-out_infinite]" />
      <header className="border-b border-subtle/60 bg-brand-surface/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-brand-surface/75 dark:border-brand-primary/25 dark:bg-brand-surface/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="focus-ring rounded-full bg-brand-surface/80 p-2 text-xl shadow-sm lg:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <Link to="/dashboard" className="relative text-lg font-semibold text-brand-primary">
              <span className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-brand-primary/10 md:block" aria-hidden />
              {t('common.brandName')}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector value={i18n.language} onChange={changeLanguage} />
            <ThemeSelector value={theme} onChange={setTheme} />
            <Button variant="secondary" asChild to="/diagnosis/quick">
              {t('dashboard.createDiagnosis')}
            </Button>
            <Menu as="div" className="relative">
              <Menu.Button className="focus-ring flex items-center gap-3 rounded-full border border-subtle/60 bg-brand-surface/80 px-2 py-1 pr-3 shadow-sm transition hover:border-brand-secondary/40 hover:bg-brand-surface">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-secondary/10 text-lg font-semibold text-brand-secondary shadow-inner">
                  {userAvatar ? (
                    <img src={userAvatar} alt={t('common.profileAvatarAlt') ?? 'Avatar'} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block text-sm font-semibold text-brand-text">{userName}</span>
                  <span className="block text-xs text-brand-muted">{userEmail}</span>
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-3 w-60 origin-top-right space-y-1 rounded-3xl border border-subtle/70 bg-brand-surface/95 p-3 text-sm shadow-xl backdrop-blur dark:bg-brand-surface">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings/profile"
                        className={`block rounded-2xl px-3 py-2 transition ${active ? 'bg-brand-primary/15 text-brand-primary' : 'text-brand-text'}`}
                      >
                        {t('common.viewProfile')}
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`block rounded-2xl px-3 py-2 transition ${active ? 'bg-brand-primary/15 text-brand-primary' : 'text-brand-text'}`}
                      >
                        {t('dashboard.settings')}
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={onSignOut}
                        className={`w-full rounded-2xl px-3 py-2 text-left transition ${active ? 'bg-brand-danger/10 text-brand-danger' : 'text-brand-danger'}`}
                      >
                        {t('common.signOut')}
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
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
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col gap-y-6 rounded-r-3xl border border-subtle/40 bg-brand-surface/95 p-6 shadow-2xl backdrop-blur">
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
                        clsx(
                          'group flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-all duration-300 ease-out focus-ring',
                          'motion-safe:hover:translate-x-1',
                          isActive
                            ? 'bg-brand-primary/20 text-brand-primary shadow-[0_18px_36px_rgba(11,110,79,0.18)]'
                            : 'text-brand-muted hover:bg-brand-surface/80 hover:text-brand-text'
                        )
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          'grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary/10 text-xl transition-transform duration-300',
                          'motion-safe:group-hover:scale-110'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="motion-safe:translate-y-0 motion-safe:group-hover:translate-x-1">{t(item.labelKey)}</span>
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
          <nav className="sticky top-28 flex flex-col gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navItemClasses({ isActive })}
              >
                <span
                  aria-hidden
                  className={clsx(
                    'grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary/10 text-lg transition-all duration-300 ease-out motion-safe:group-hover:scale-110',
                    'shadow-inner shadow-brand-primary/10',
                    isActive && 'bg-brand-primary text-white shadow-[0_12px_26px_rgba(11,110,79,0.35)]'
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left transition motion-safe:group-hover:translate-x-1">{t(item.labelKey)}</span>
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-brand-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-60"
                />
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="relative flex-1 space-y-8 pb-20">
          <div className="pointer-events-none absolute -left-20 top-0 hidden h-64 w-64 rounded-full bg-brand-secondary/10 blur-3xl md:block" />
          <div className="rounded-3xl border border-subtle/70 bg-brand-surface/85 p-8 shadow-card backdrop-blur transition-all duration-500 animate-[fade-in-up_0.6s_ease-out] dark:border-brand-primary/20 dark:bg-brand-surface/95">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
