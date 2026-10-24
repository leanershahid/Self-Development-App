import React, { useState } from 'react';
import { cn } from './cn';

const VARIANTS = {
  default: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
  danger: 'text-[var(--text-muted)] hover:text-danger hover:bg-danger/10',
  accent: 'text-[var(--text-muted)] hover:text-accent hover:bg-accent/10',
  primary: 'text-[var(--text-muted)] hover:text-primary hover:bg-primary/10',
};

const SIZES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

export default function IconButton({
  variant = 'default',
  size = 'md',
  rounded = 'lg',
  className = '',
  label,
  children,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        aria-label={label}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className={cn(
          'inline-flex items-center justify-center border border-transparent transition-all duration-200',
          'hover:scale-110 active:scale-95',
          rounded === 'full' ? 'rounded-full' : 'rounded-lg',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...rest}
      >
        {children}
      </button>
      {label && hover && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap px-2 py-1 rounded-md text-[11px] font-medium text-white bg-[#111318] pointer-events-none">
          {label}
        </span>
      )}
    </span>
  );
}
