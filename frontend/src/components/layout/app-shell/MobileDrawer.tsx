import { Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import LanguageSelector from '@/components/ui/LanguageSelector';
import ThemeSelector from '@/components/ui/ThemeSelector';
import type { Theme } from '@/app/providers/ThemeProvider';
import type { NavigationItem } from './navigation';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  language: string;
  onLanguageChange: (lng: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onSignOut: () => Promise<void> | void;
};

const MobileDrawer = ({
  isOpen,
  onClose,
  items,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onSignOut
}: MobileDrawerProps) => {
  const { t } = useTranslation();

  const handleNavigate = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSignOut = useCallback(async () => {
    onClose();
    await onSignOut();
  }, [onClose, onSignOut]);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
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
                <Link to="/dashboard" className="text-lg font-semibold text-brand-primary" onClick={handleNavigate}>
                  {t('common.brandName')}
                </Link>
                <button
                  type="button"
                  className="focus-ring rounded-full border border-brand-secondary/30 p-2"
                  onClick={handleNavigate}
                  aria-label={t('common.closeMenu', 'Close menu')}
                >
                  <svg
                    aria-hidden
                    className="h-5 w-5 text-brand-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-3">
                {items.map((item) => (
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
                    onClick={handleNavigate}
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
              <div className="mt-2 border-t border-subtle/40 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  {t('dashboard.quickActions', 'Actions rapides')}
                </p>
                <Button asChild to="/diagnosis/quick" onClick={handleNavigate}>
                  {t('dashboard.createDiagnosis')}
                </Button>
              </div>
              <div className="border-t border-subtle/40 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  {t('dashboard.preferences', 'PrÇ¸fÇ¸rences')}
                </p>
                <div className="flex flex-col gap-3">
                  <LanguageSelector value={language} onChange={onLanguageChange} />
                  <ThemeSelector value={theme} onChange={onThemeChange} />
                </div>
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                {t('common.signOut')}
              </Button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MobileDrawer;
