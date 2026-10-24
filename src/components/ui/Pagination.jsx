import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './IconButton';

export default function Pagination({ page, pageCount, onChange, totalItems, pageSize }) {
  if (pageCount <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 px-1 pt-3">
      <p className="text-xs text-[var(--text-muted)]">
        Showing <span className="font-medium text-[var(--text)]">{start}-{end}</span> of <span className="font-medium text-[var(--text)]">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <IconButton label="Previous page" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></IconButton>
        <span className="text-xs font-medium text-[var(--text)] tabular-nums">{page} / {pageCount}</span>
        <IconButton label="Next page" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></IconButton>
      </div>
    </div>
  );
}
