import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type UserMenuProps = {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  onSignOut: () => Promise<void> | void;
};

const UserMenu = ({ userName, userEmail, userAvatar, onSignOut }: UserMenuProps) => {
  const { t } = useTranslation();

  return (
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
        <Menu.Items className="absolute right-0 z-50 mt-3 w-60 origin-top-right space-y-1 rounded-3xl border border-subtle/70 bg-brand-surface/95 p-3 text-sm shadow-2xl backdrop-blur dark:bg-brand-surface">
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
  );
};

export default UserMenu;
