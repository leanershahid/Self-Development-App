import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from './cn';
import { fieldClasses, fieldStatusClasses } from './fieldClasses';
import FieldWrapper from './FieldWrapper';

export default function DateField({ label, helperText, error, success, required, className = '', id, ...rest }) {
  const inputId = id || rest.name;
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} error={error} success={success} helperText={helperText}>
      <div className="relative">
        <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="date"
          id={inputId}
          className={cn(
            fieldClasses,
            'pl-10',
            error && fieldStatusClasses.error,
            success && fieldStatusClasses.success,
            className
          )}
          {...rest}
        />
      </div>
    </FieldWrapper>
  );
}
