import React from 'react';
import { cn } from './cn';

export default function Card({ as = 'div', className = '', children, interactive = true, animate = true, ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)]',
        'transition-all duration-300 ease-out',
        interactive && 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]',
        animate && 'animate-fade-in-up',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon, action, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform duration-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
