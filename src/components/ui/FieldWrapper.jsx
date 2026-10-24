import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from './cn';

export default function FieldWrapper({ label, htmlFor, required, error, success, helperText, className = '', children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text)]">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-xs text-accent">
          <CheckCircle2 size={13} className="shrink-0" />
          {typeof success === 'string' ? success : 'Looks good'}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
