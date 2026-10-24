import React from 'react';
import { cn } from './cn';

export default function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[var(--border)]', className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              active ? 'text-primary' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {tab.label}
            {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}
