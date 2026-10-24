import React from 'react';
import { cn } from './cn';

export function Radio({ checked, onChange, label, description, name, value, disabled, className = '' }) {
  return (
    <label className={cn('flex items-start gap-2.5 cursor-pointer select-none py-1', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
        <span
          className={cn(
            'w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150',
            'border-[var(--field-border)] bg-[var(--surface)]',
            'peer-checked:border-primary peer-checked:border-[6px]',
            'peer-focus-visible:ring-4 peer-focus-visible:ring-primary/15'
          )}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-[var(--text)]">{label}</span>}
          {description && <span className="text-xs text-[var(--text-muted)]">{description}</span>}
        </span>
      )}
    </label>
  );
}

export default function RadioGroup({ name, options, value, onChange, direction = 'vertical', className = '' }) {
  return (
    <div className={cn('flex gap-3', direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap', className)} role="radiogroup">
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          disabled={opt.disabled}
        />
      ))}
    </div>
  );
}
