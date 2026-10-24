import React, { useEffect, useRef } from 'react';
import { cn } from './cn';
import { fieldClasses, fieldStatusClasses } from './fieldClasses';
import FieldWrapper from './FieldWrapper';

export default function Textarea({
  label, helperText, error, success, required, className = '', id, rows = 4,
  autoResize = true, maxLength, value, onChange, ...rest
}) {
  const inputId = id || rest.name;
  const ref = useRef(null);

  useEffect(() => {
    if (!autoResize || !ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value, autoResize]);

  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} error={error} success={success} helperText={helperText}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className={cn(
          fieldClasses,
          'h-auto py-2.5 resize-y',
          autoResize && 'resize-none overflow-hidden',
          error && fieldStatusClasses.error,
          success && fieldStatusClasses.success,
          className
        )}
        {...rest}
      />
      {typeof maxLength === 'number' && (
        <div className="flex justify-end -mt-1">
          <span className={cn('text-xs', (value?.length || 0) >= maxLength ? 'text-danger' : 'text-[var(--text-muted)]')}>
            {value?.length || 0} / {maxLength}
          </span>
        </div>
      )}
    </FieldWrapper>
  );
}
