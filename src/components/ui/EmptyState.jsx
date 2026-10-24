import React from 'react';
import { cn } from './cn';

export default function EmptyState({ icon, title, message, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{title}</h3>
      {message && <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}
