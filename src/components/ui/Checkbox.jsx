import React from 'react';
import { Check } from 'lucide-react';
import { cn } from './cn';

export default function Checkbox({ checked, onChange, label, className = '', disabled, ...rest }) {
  return (
    <label className={cn('inline-flex items-center gap-2.5 cursor-pointer select-none py-1', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" {...rest} />
        <span
          className={cn(
            'w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-150',
            'border-[var(--field-border)] bg-[var(--surface)]',
            'peer-checked:bg-accent peer-checked:border-accent peer-checked:scale-105',
            'peer-focus-visible:ring-4 peer-focus-visible:ring-accent/15'
          )}
        >
          <Check size={13} className={cn('text-white transition-transform duration-150 scale-0 peer-checked:scale-100', checked && 'scale-100')} strokeWidth={3} />
        </span>
      </span>
      {label && <span className="text-sm text-[var(--text)]">{label}</span>}
    </label>
  );
}
