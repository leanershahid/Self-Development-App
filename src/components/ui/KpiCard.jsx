import React from 'react';
import Card from './Card';
import { cn } from './cn';

export default function KpiCard({ icon, label, value, unit, trend, progress, tone = 'primary', footer, className = '' }) {
  return (
    <Card className={cn('p-5 flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
        {icon && (
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              tone === 'accent' ? 'bg-accent/10 text-accent' : tone === 'danger' ? 'bg-danger/10 text-danger' : tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-[var(--text)] tabular-nums">{value}</span>
        {unit && <span className="text-sm text-[var(--text-muted)]">{unit}</span>}
        {trend && (
          <span className={cn('ml-auto text-xs font-medium', trend.direction === 'down' ? 'text-danger' : 'text-accent')}>
            {trend.direction === 'down' ? '↓' : '↑'} {trend.label}
          </span>
        )}
      </div>

      {typeof progress === 'number' && (
        <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}

      {footer && <div className="pt-1">{footer}</div>}
    </Card>
  );
}
