import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Save, Search, Calendar, FileText, Sparkles, X } from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Badge, Input, Textarea, Tabs, KpiCard, EmptyState, Table, useToast } from './ui';
import { supabase } from '../supabase';

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
  const toast = useToast();
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
    toast.success('Entry saved');
  };

  const filtered = entries.filter(e =>
    !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = entries.reduce((s, e) => s + (e.word_count || 0), 0);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const tableColumns = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (e) => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'title',
      header: 'Title',
      render: (e) => <span className="font-medium text-[var(--text)]">{e.title || 'Untitled Entry'}</span>,
    },
    {
      key: 'word_count',
      header: 'Words',
      sortable: true,
      render: (e) => e.word_count || 0,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          {(e.tags || []).map((t, i) => <Badge key={i} variant="primary">#{t}</Badge>)}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Daily Journal</h1>
          <p className="text-sm text-[var(--text-muted)]">Reflect, record, and grow one day at a time.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={<BookOpen size={18} />} label="Entries" value={entries.length} />
        <KpiCard icon={<FileText size={18} />} label="Total Words" value={totalWords.toLocaleString()} />
        <KpiCard
          icon={<Calendar size={18} />}
          label="This Month"
          value={entries.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7))).length}
        />
      </div>

      <Tabs
        tabs={[
          { value: 'write', label: "Today's Entry" },
          { value: 'browse', label: 'Browse All' },
        ]}
        value={view}
        onChange={setView}
      />

      <AnimatePresence mode="wait">
        {view === 'write' ? (
          <motion.div key="write" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}>
            <Card>
              <CardHeader
                icon={<BookOpen size={16} />}
                title={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                subtitle={`${wordCount} words`}
              />
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
                  <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--text-muted)] italic">{prompt}</p>
                </div>

                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title (optional)..." />

                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((t, i) => (
                    <Badge key={i} variant="primary">
                      #{t}
                      <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-danger transition-colors">
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { e.preventDefault(); setTags([...tags, tagInput.trim()]); setTagInput(''); } }}
                    placeholder="+ tag"
                    className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{ minWidth: 70 }}
                  />
                </div>

                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts here..." rows={10} autoResize />

                <div className="flex justify-end">
                  <Button variant="primary" icon={<Save size={16} />} onClick={save} disabled={!content.trim()} loading={saving}>
                    {saving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="browse" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="flex flex-col gap-4">
            <Input leadingIcon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." />

            {filtered.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={22} />}
                title={search ? 'No entries match your search' : 'No journal entries yet'}
              />
            ) : (
              <Card>
                <Table
                  columns={tableColumns}
                  data={filtered}
                  rowKey={(e) => e.id}
                  onRowClick={(e) => setSelected(selected?.id === e.id ? null : e)}
                  pageSize={10}
                />
              </Card>
            )}

            <AnimatePresence>
              {selected && (
                <motion.div key={selected.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Card>
                    <CardHeader
                      icon={<Calendar size={16} />}
                      title={selected.title || 'Untitled Entry'}
                      subtitle={new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      action={
                        <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                          <X size={16} />
                        </button>
                      }
                    />
                    <CardBody>
                      <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
