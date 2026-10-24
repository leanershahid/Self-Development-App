import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

const VARIANTS = {
  primary: 'bg-primary text-white border border-primary hover:bg-primary-hover shadow-sm hover:shadow disabled:hover:bg-primary',
  secondary: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--field-border)] hover:bg-[var(--surface-hover)]',
  success: 'bg-accent text-white border border-accent hover:bg-accent-hover shadow-sm disabled:hover:bg-accent',
  accent: 'bg-accent text-white border border-accent hover:bg-accent-hover shadow-sm disabled:hover:bg-accent',
  ghost: 'bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
  danger: 'bg-[var(--surface)] text-danger border border-danger/30 hover:bg-danger hover:text-white',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] font-medium transition-all duration-200',
        'hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
