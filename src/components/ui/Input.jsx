import React from 'react';
import { cn } from './cn';
import { fieldClasses, fieldStatusClasses } from './fieldClasses';
import FieldWrapper from './FieldWrapper';

export default function Input({ label, helperText, error, success, required, className = '', id, leadingIcon, trailingIcon, ...rest }) {
  const inputId = id || rest.name;
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} error={error} success={success} helperText={helperText}>
      <div className="relative">
        {leadingIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leadingIcon}</span>}
        <input
          id={inputId}
          className={cn(
            fieldClasses,
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            error && fieldStatusClasses.error,
            success && fieldStatusClasses.success,
            className
          )}
          {...rest}
        />
        {trailingIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{trailingIcon}</span>}
      </div>
    </FieldWrapper>
  );
}
