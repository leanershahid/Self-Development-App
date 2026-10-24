import React from 'react';
import { cn } from './cn';

const SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');

  return (
    <div className={cn('relative rounded-full overflow-hidden shrink-0 bg-primary text-white flex items-center justify-center font-semibold', SIZES[size], className)}>
      {src ? <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" /> : <span>{initials || '?'}</span>}
    </div>
  );
}
