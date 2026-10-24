import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';
import { fieldClasses, fieldStatusClasses } from './fieldClasses';
import FieldWrapper from './FieldWrapper';

export default function Select({ label, helperText, error, success, required, className = '', id, children, ...rest }) {
  const inputId = id || rest.name;
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} error={error} success={success} helperText={helperText}>
      <div className="relative">
        <select
          id={inputId}
          className={cn(
            fieldClasses,
            'appearance-none pr-9 cursor-pointer',
            error && fieldStatusClasses.error,
            success && fieldStatusClasses.success,
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
    </FieldWrapper>
  );
}
