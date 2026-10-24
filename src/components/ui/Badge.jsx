import React from 'react';
import { cn } from './cn';

const VARIANTS = {
  success: 'bg-accent/10 text-accent',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-secondary/10 text-secondary',
  primary: 'bg-primary/10 text-primary',
};

export default function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap animate-scale-in transition-colors duration-200', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
