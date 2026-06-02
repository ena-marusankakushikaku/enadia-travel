'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger' | 'pro' | 'premium';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-enadia-primary text-white shadow-sm hover:bg-enadia-primaryDark',
  secondary: 'border border-enadia-line bg-white text-enadia-ink hover:bg-slate-50',
  dark: 'bg-enadia-ink text-white hover:bg-slate-800',
  ghost: 'bg-transparent text-enadia-muted hover:bg-slate-100',
  danger: 'bg-enadia-danger text-white hover:bg-red-700',
  pro: 'bg-enadia-pro text-white hover:bg-blue-700',
  premium: 'bg-enadia-premium text-white hover:bg-violet-700'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-13 px-5 text-base'
};

export function Button({
  children,
  className,
  disabled,
  icon,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-enadia-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}
