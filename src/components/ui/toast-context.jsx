import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import ToastContext from './ToastContext';
import { cn } from './cn';

const ICONS = {
  success: <CheckCircle2 size={18} className="text-accent" />,
  error: <XCircle size={18} className="text-danger" />,
  info: <Info size={18} className="text-info" />,
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    show,
    success: (message, opts) => show(message, { ...opts, type: 'success' }),
    error: (message, opts) => show(message, { ...opts, type: 'error' }),
    info: (message, opts) => show(message, { ...opts, type: 'info' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2 w-full max-w-sm">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className={cn('flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] p-4')}
              >
                {ICONS[t.type]}
                <p className="flex-1 text-sm text-[var(--text)]">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="Dismiss">
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
