import React, { useState } from 'react';
import { cn } from './cn';

export default function Tooltip({ label, children, side = 'top', className = '' }) {
  const [open, setOpen] = useState(false);
  if (!label) return children;

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      {open && (
        <span role="tooltip" className={cn('absolute z-50 whitespace-nowrap px-2 py-1 rounded-md text-xs font-medium text-white bg-[#111318] pointer-events-none', sideClasses[side], className)}>
          {label}
        </span>
      )}
    </span>
  );
}
