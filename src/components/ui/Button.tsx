import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
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

type AnchorProps = BaseProps & {
  asChild: true;
  to: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-primary/20 hover:from-brand-accent hover:to-brand-secondary focus-visible:outline-brand-secondary disabled:from-brand-muted disabled:to-brand-muted',
  secondary:
    'border border-brand-secondary/60 text-brand-secondary hover:border-brand-secondary hover:bg-brand-background focus-visible:outline-brand-secondary',
  ghost:
    'text-brand-secondary hover:bg-brand-background/60 focus-visible:outline-brand-secondary'
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const Button = forwardRef<HTMLButtonElement, ButtonProps | AnchorProps>(
  ({ variant = 'primary', size = 'md', isLoading, icon, className, children, asChild, ...rest }, ref) => {
    const classes = clsx(
      'focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (asChild) {
      const anchorProps = rest as AnchorProps;
      return (
        <Link className={classes} {...anchorProps}>
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
