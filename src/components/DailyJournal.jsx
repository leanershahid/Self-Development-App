import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Save, Search, Calendar, ChevronLeft, ChevronRight, Sparkles, Tag, X } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://quufeiwzsgiuwkeyjjns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg'
);

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const PROMPTS = [
  "What was your biggest win today?",
  "What challenged you and how did you handle it?",
  "What are you grateful for right now?",
  "What would make tomorrow even better?",
  "What did you learn about yourself today?",
  "Describe your energy levels and mood today.",
  "What's one thing you want to remember from today?",
];

export default function DailyJournal() {
  const [entries, setEntries]   = useState([]);
  const [content, setContent]   = useState('');
  const [title, setTitle]       = useState('');
  const [tags, setTags]         = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [view, setView]         = useState('write');
  const [prompt]                = useState(PROMPTS[new Date().getDay() % PROMPTS.length]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    setEntries(data || []);
    const todayEntry = (data || []).find(e => e.date === today);
    if (todayEntry) { setContent(todayEntry.content); setTitle(todayEntry.title || ''); setTags(todayEntry.tags || []); }
  };

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const existing = entries.find(e => e.date === today);
    const payload = { date: today, content: content.trim(), title: title.trim() || null, word_count: content.trim().split(/\s+/).length, tags };
    if (existing) {
      await supabase.from('journal_entries').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('journal_entries').insert(payload);
    }
    await load();
    setSaving(false);
  };

  const filtered = entries.filter(e =>
    !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = entries.reduce((s, e) => s + (e.word_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-violet-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
            <BookOpen size={32} className="text-violet-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-violet-500 mb-2">DAILY JOURNAL</h1>
          <p className="text-violet-400/50 font-mono text-xs tracking-[0.3em] uppercase">Reflect · Record · Grow</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Entries', value: entries.length, color: '#a78bfa' },
            { label: 'Total Words', value: totalWords.toLocaleString(), color: '#22d3ee' },
            { label: 'This Month', value: entries.filter(e => e.date?.startsWith(new Date().toISOString().slice(0,7))).length, color: '#4ade80' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={GLASS}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[['write', "Today's Entry", <BookOpen size={14} />], ['browse', 'Browse All', <Search size={14} />]].map(([v, label, icon]) => (
            <button key={v} onClick={() => setView(v)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
              style={view === v
                ? { background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }
                : { background: 'transparent', border: '1px solid transparent', color: '#475569' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <motion.div key="write" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Prompt */}
              <div className="rounded-2xl p-4 mb-4 flex items-start gap-3" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <Sparkles size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-violet-300/80 italic">{prompt}</p>
              </div>

              <div className="rounded-3xl p-6" style={GLASS}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">{content.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title (optional)..."
                  className="w-full px-0 py-2 mb-3 bg-transparent text-lg font-bold text-slate-200 placeholder-slate-700 focus:outline-none border-b border-white/5" />
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                      #{t}
                      <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { e.preventDefault(); setTags([...tags, tagInput.trim()]); setTagInput(''); }}}
                    placeholder="+ tag"
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-violet-400 placeholder-slate-700 focus:outline-none"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', minWidth: 60 }} />
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts here..."
                  rows={12} className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-700 focus:outline-none resize-none leading-relaxed" />
                <div className="flex justify-end mt-4">
                  <button onClick={save} disabled={saving || !content.trim()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-40"
                    style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="browse" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <div className="space-y-3">
                {filtered.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="rounded-2xl p-5 cursor-pointer transition-all hover:border-violet-500/30"
                    style={{ ...GLASS, border: selected?.id === entry.id ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)' }}
                    onClick={() => setSelected(selected?.id === entry.id ? null : entry)}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{entry.title || 'Untitled Entry'}</p>
                        <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          {entry.word_count ? ` · ${entry.word_count} words` : ''}
                        </p>
                        {entry.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.map((t, i) => (
                              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Calendar size={14} className="text-slate-600 flex-shrink-0" />
                    </div>
                    <AnimatePresence>
                      {selected?.id === entry.id ? (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap mt-3 pt-3 border-t border-white/5">
                          {entry.content}
                        </motion.p>
                      ) : (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{entry.content}</p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 rounded-3xl" style={GLASS}>
                    <BookOpen className="text-slate-700 mx-auto mb-3" size={36} />
                    <p className="text-slate-500 font-mono text-sm">{search ? 'No entries match your search' : 'No journal entries yet'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
