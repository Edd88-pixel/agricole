import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useTheme } from '@/app/providers/ThemeProvider';
import { supportedLanguages } from '@/app/i18n';
import HeaderQuickActions from './app-shell/HeaderQuickActions';
import UserMenu from './app-shell/UserMenu';
import DesktopSidebar from './app-shell/DesktopSidebar';
import MobileDrawer from './app-shell/MobileDrawer';
import { NAVIGATION_ITEMS } from './app-shell/navigation';

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

  const changeLanguage = useCallback(
    (lng: string) => {
      if (supportedLanguages.includes(lng as (typeof supportedLanguages)[number])) {
        void i18n.changeLanguage(lng);
      }
    },
    [i18n]
  );

  const handleMobileToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-brand-background via-white to-brand-background text-brand-text transition-colors dark:from-[#0b1f19] dark:via-[#071410] dark:to-[#0b1f19] dark:text-brand-text">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-32 right-[-140px] h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl opacity-0 md:opacity-80 motion-safe:animate-[float-soft_12s_ease-in-out_infinite]" />
      <header className="relative z-40 border-b border-subtle/60 bg-brand-surface/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-brand-surface/75 dark:border-brand-primary/25 dark:bg-brand-surface/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="focus-ring rounded-full bg-brand-surface/80 p-2 text-xl shadow-sm lg:hidden"
              aria-label={mobileOpen ? t('common.closeMenu', 'Close menu') : t('common.openMenu', 'Open menu')}
              onClick={handleMobileToggle}
            >
              {mobileOpen ? (
                <svg
                  aria-hidden
                  className="h-6 w-6 text-brand-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                </svg>
              ) : (
                <svg
                  aria-hidden
                  className="h-6 w-6 text-brand-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                </svg>
              )}
            </button>
            <Link to="/dashboard" className="relative text-lg font-semibold text-brand-primary">
              <span className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-brand-primary/10 md:block" aria-hidden />
              {t('common.brandName')}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <HeaderQuickActions
              language={i18n.language}
              onLanguageChange={changeLanguage}
              theme={theme}
              onThemeChange={setTheme}
            />
            <UserMenu userName={userName} userEmail={userEmail} userAvatar={userAvatar} onSignOut={onSignOut} />
          </div>
        </div>
      </header>
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={handleMobileClose}
        items={NAVIGATION_ITEMS}
        language={i18n.language}
        onLanguageChange={changeLanguage}
        theme={theme}
        onThemeChange={setTheme}
        onSignOut={onSignOut}
      />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 lg:px-8">
        <DesktopSidebar items={NAVIGATION_ITEMS} navItemClasses={navItemClasses} />
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
