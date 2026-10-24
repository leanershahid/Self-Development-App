import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from './cn';
import Pagination from './Pagination';
import { SkeletonTable } from './Skeleton';

export default function Table({ columns, data, rowKey = (row) => row.id, loading = false, emptyState = null, pageSize = 10, className = '', onRowClick }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    const accessor = col?.sortValue || ((row) => row[sort.key]);
    return [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((prev) => (prev.key !== col.key ? { key: col.key, dir: 'asc' } : { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  if (loading) return <div className={className}><SkeletonTable columns={columns.length} /></div>;
  if (!data.length) return <div className={className}>{emptyState}</div>;

  return (
    <div className={className}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-[var(--surface)] z-10">
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col)} className={cn('text-left font-medium text-[var(--text-muted)] px-3 py-2.5 whitespace-nowrap select-none', col.sortable && 'cursor-pointer hover:text-[var(--text)]')} style={{ width: col.width }}>
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (sort.key === col.key ? (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} className="opacity-40" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className={cn('border-b border-[var(--border)] last:border-0 transition-colors', i % 2 === 1 && 'bg-[var(--bg)]/60', onRowClick ? 'cursor-pointer hover:bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]')}>
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 align-middle">{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={sorted.length} pageSize={pageSize} />}
    </div>
  );
}
