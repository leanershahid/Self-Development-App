import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, CheckSquare, Flame, ScrollText, Brain, BookOpen, Map, Users, Quote,
  FileText, Mic2, Swords, Shield, Heart, Wallet, Medal, Loader2, Inbox,
} from 'lucide-react';
import { supabase } from '../supabase';

// Searches across every content table in the app from one place, instead of
// requiring the user to know which of the ~19 feature pages a note/task/entry
// lives on. Each source below defines how to query its table and how to turn a
// matched row into a clickable result; sources that point into a tabbed hub
// (Reflections, Progress) pass a `tab` so the hub opens directly on the right
// tab via router state (see ReflectionsHub/ProgressHub's `location.state.tab`).
const SOURCES = [
  { table: 'ToDo', column: 'title', select: 'id, title', label: 'Tasks', icon: CheckSquare, path: '/', title: (r) => r.title },
  { table: 'habits', column: 'name', select: 'id, name', label: 'Habits', icon: Flame, path: '/habits', title: (r) => r.name },
  { table: 'journal_entries', column: 'content', select: 'id, title, date, content', label: 'Journal', icon: ScrollText, path: '/reflections', tab: 'journal', title: (r) => r.title || r.date, subtitle: (r) => (r.content || '').slice(0, 80) },
  { table: 'skills', column: 'name', select: 'id, name', label: 'Skills', icon: Brain, path: '/skills', title: (r) => r.name },
  { table: 'books_tracker', column: 'title', select: 'id, title, author', label: 'Books', icon: BookOpen, path: '/books', title: (r) => r.title, subtitle: (r) => r.author },
  { table: 'plans', column: 'title', select: 'id, title, category', label: 'Plans', icon: Map, path: '/plans', title: (r) => r.title, subtitle: (r) => r.category },
  { table: 'friends', column: 'name', select: 'id, name', label: 'Friends', icon: Users, path: '/freinds', title: (r) => r.name },
  { table: 'quotes', column: 'quote_text', select: 'id, quote_text, author', label: 'Quotes', icon: Quote, path: '/inspirations', title: (r) => r.quote_text, subtitle: (r) => r.author },
  { table: 'scripts', column: 'title', select: 'id, title', label: 'Scripts', icon: FileText, path: '/script-writer', title: (r) => r.title },
  { table: 'mirror_talk', column: 'text', select: 'id, text', label: 'Mirror Talk', icon: Mic2, path: '/reflections', tab: 'mirror-talk', title: (r) => r.text },
  { table: 'fear_crusher', column: 'fear', select: 'id, fear', label: 'Fear Crusher', icon: Swords, path: '/reflections', tab: 'fear-crusher', title: (r) => r.fear },
  { table: 'comfort_zone', column: 'action', select: 'id, action', label: 'Comfort Zone', icon: Shield, path: '/reflections', tab: 'comfort-zone', title: (r) => r.action },
  { table: 'patience_logs', column: 'trigger', select: 'id, trigger', label: 'Patience', icon: Heart, path: '/reflections', tab: 'patience', title: (r) => r.trigger },
  { table: 'money_transactions', column: 'title', select: 'id, title, category', label: 'Money', icon: Wallet, path: '/money', title: (r) => r.title, subtitle: (r) => r.category },
  { table: 'achievements', column: 'title', select: 'id, title, description', label: 'Achievements', icon: Medal, path: '/achievements', title: (r) => r.title, subtitle: (r) => r.description },
  { table: 'quick_captures', column: 'content', select: 'id, content', label: 'Captures', icon: Inbox, path: '/capture', title: (r) => r.content },
];

export default function UniversalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setGroups([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setGroups([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const like = `%${term}%`;
      const results = await Promise.all(
        SOURCES.map(async (src) => {
          const { data, error } = await supabase.from(src.table).select(src.select).ilike(src.column, like).limit(5);
          if (error || !data?.length) return null;
          return { src, items: data };
        })
      );
      setGroups(results.filter(Boolean));
      setLoading(false);
      setSearched(true);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const goTo = (src) => {
    navigate(src.path, src.tab ? { state: { tab: src.tab } } : undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-xl bg-[var(--surface)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border)] max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
          {loading ? <Loader2 size={18} className="text-[var(--text-muted)] animate-spin shrink-0" /> : <Search size={18} className="text-[var(--text-muted)] shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search tasks, habits, journal, quotes, plans..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden sm:block text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Type at least 2 characters to search everywhere.</p>
          )}

          {searched && !loading && groups.length === 0 && query.trim().length >= 2 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No results for "{query}".</p>
          )}

          {groups.map(({ src, items }) => {
            const Icon = src.icon;
            return (
              <div key={src.table} className="px-2 py-2 border-b border-[var(--border)] last:border-0">
                <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{src.label}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goTo(src)}
                    className="w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-[var(--text)] truncate">{src.title(item) || '(untitled)'}</span>
                      {src.subtitle?.(item) && (
                        <span className="block text-xs text-[var(--text-muted)] truncate">{src.subtitle(item)}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
