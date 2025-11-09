import { clsx } from 'clsx';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

const Card = ({ children, className, as: Component = 'div' }: CardProps) => (
  <Component
    className={clsx(
      'group relative overflow-hidden rounded-3xl border border-subtle/70 bg-brand-surface/80 p-8 shadow-card backdrop-blur transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_24px_60px_rgba(11,30,20,0.12)] dark:border-brand-primary/20 dark:bg-brand-surface/90 dark:shadow-[0_24px_60px_rgba(68,214,176,0.08)]',
      className
    )}
  >
    <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-brand-primary/20 dark:to-brand-secondary/20" />
    <span className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px w-full bg-gradient-to-r from-transparent via-brand-secondary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
    {children}
  </Component>
);

export default Card;
