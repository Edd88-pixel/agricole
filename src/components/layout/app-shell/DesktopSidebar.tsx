import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { NavigationItem } from './navigation';

type DesktopSidebarProps = {
  items: NavigationItem[];
  navItemClasses: ({ isActive }: { isActive: boolean }) => string;
};

const DesktopSidebar = ({ items, navItemClasses }: DesktopSidebarProps) => {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav className="sticky top-28 flex flex-col gap-2">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navItemClasses({ isActive })}>
            {({ isActive }) => (
              <>
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
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default memo(DesktopSidebar);
