import { clsx } from 'clsx';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

const Card = ({ children, className, as: Component = 'div' }: CardProps) => (
  <Component
    className={clsx(
      'group relative overflow-hidden rounded-3xl border border-subtle/60 bg-brand-surface/80 p-8 dark:p-10 lg:dark:p-12 shadow-card backdrop-blur transition-transform duration-200 hover:-translate-y-1',
      className
    )}
  >
    <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-brand-primary/15 dark:to-brand-secondary/15" />
    {children}
  </Component>
);

export default Card;
