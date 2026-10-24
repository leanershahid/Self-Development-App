import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { cn } from './cn';

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    const t = setTimeout(() => panelRef.current?.querySelector('input, textarea, select, button')?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn('relative w-full bg-[var(--surface)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border)] max-h-[90vh] flex flex-col', SIZES[size])}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
                <IconButton label="Close" onClick={onClose}>
                  <X size={18} />
                </IconButton>
              </div>
            )}
            <div className="px-5 py-4 overflow-y-auto">{children}</div>
            {footer && <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] shrink-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
