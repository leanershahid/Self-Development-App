import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Inbox } from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from './ui';

// Global "drop a thought anywhere" capture — a floating button (+ Ctrl+Shift+C
// shortcut) that opens a single textarea, no category/priority/due-date
// decision required up front. Saved rows land in `quick_captures` with
// status='inbox' and get triaged later on the /capture page (converted into a
// real ToDo, or archived). The point is removing friction at the moment an
// idea occurs, not asking the user to file it correctly right away.
export default function QuickCapture() {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const close = () => {
    setOpen(false);
    setText('');
  };

  const save = async (andGoToInbox = false) => {
    const content = text.trim();
    if (!content) return;
    setSaving(true);
    const { error } = await supabase.from('quick_captures').insert({ content });
    setSaving(false);
    if (error) {
      toast.error('Failed to save — has the quick_captures table been created? (see supabase/quick_capture.sql)');
      return;
    }
    toast.success('Captured! Triage it anytime from the Inbox.');
    close();
    if (andGoToInbox) navigate('/capture');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick capture"
        title="Quick capture (Ctrl+Shift+C)"
        className="fixed bottom-6 right-6 z-[1100] w-14 h-14 rounded-full bg-primary text-white shadow-[var(--shadow-lg)] flex items-center justify-center hover:bg-primary-hover transition-colors active:scale-95"
      >
        <Plus size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-4" onClick={close}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-md bg-[var(--surface)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)]">Quick Capture</p>
              <p className="text-xs text-[var(--text-muted)]">Jot it down now, sort it out later.</p>
            </div>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close();
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
                }}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full resize-none rounded-lg border border-[var(--field-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => save(true)}
                disabled={!text.trim() || saving}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-40"
              >
                <Inbox size={13} /> Save &amp; open inbox
              </button>
              <div className="flex items-center gap-2">
                <button onClick={close} className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => save(false)}
                  disabled={!text.trim() || saving}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Capture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
