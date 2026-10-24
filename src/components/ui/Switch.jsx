import React from 'react';
import { cn } from './cn';

export default function Switch({ checked, onChange, label, description, disabled, className = '' }) {
  return (
    <label className={cn('flex items-center justify-between gap-4 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-[var(--text)]">{label}</span>}
          {description && <span className="text-xs text-[var(--text-muted)]">{description}</span>}
        </span>
      )}
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
        <span
          className={cn(
            'w-10 h-6 rounded-full transition-colors duration-200',
            'bg-[var(--field-border)] peer-checked:bg-accent',
            'peer-focus-visible:ring-4 peer-focus-visible:ring-accent/15'
          )}
        />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
