import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.path || item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-[var(--text-muted)]" />}
            {isLast || !item.path ? (
              <span className={isLast ? 'font-medium text-[var(--text)]' : 'text-[var(--text-muted)]'}>{item.label}</span>
            ) : (
              <Link to={item.path} className="text-[var(--text-muted)] hover:text-[var(--text)]">{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
