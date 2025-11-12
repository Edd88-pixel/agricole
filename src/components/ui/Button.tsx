import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: false;
  };

type AnchorProps = BaseProps &
  Omit<LinkProps, keyof BaseProps> & {
    asChild: true;
  };

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white shadow-lg shadow-brand-primary/25 hover:from-brand-secondary hover:to-brand-accent hover:shadow-[0_18px_38px_rgba(11,110,79,0.35)] before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-white/10 before:opacity-0 before:transition-opacity before:duration-300 before:content-[""] hover:before:opacity-100 focus-visible:outline-brand-secondary disabled:from-brand-muted disabled:via-brand-muted disabled:to-brand-muted',
  secondary:
    'border border-brand-secondary/60 text-brand-secondary shadow-sm shadow-brand-secondary/10 hover:border-brand-secondary hover:bg-brand-background/70 hover:shadow-[0_16px_32px_rgba(16,124,140,0.18)] focus-visible:outline-brand-secondary',
  ghost:
    'text-brand-secondary hover:bg-brand-background/80 hover:text-brand-primary focus-visible:outline-brand-secondary'
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const Button = forwardRef<HTMLButtonElement, ButtonProps | AnchorProps>(
  ({ variant = 'primary', size = 'md', isLoading, icon, className, children, asChild, ...rest }, ref) => {
    const classes = clsx(
      'focus-ring relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (asChild) {
      const { to, ...linkProps } = rest as AnchorProps;
      return (
        <Link className={classes} to={to} {...linkProps}>
          {icon}
          {children}
        </Link>
      );
    }

    const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button ref={ref} className={classes} {...buttonProps}>
        {isLoading && <span aria-hidden className="animate-spin">⏳</span>}
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
