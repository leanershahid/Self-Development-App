import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Check, Star, Pencil, StickyNote, Layers, Clock, Calendar } from 'lucide-react';
import { Card, CardBody, Badge, Button, IconButton, Input, DateField, Select, Textarea, Modal, ConfirmDialog, EmptyState, SkeletonCard, useToast } from './ui';
import { supabase } from '../supabase';

const LEVELS = [
  { min: 0,   max: 10,  label: 'Not Started', emoji: '🌑', color: '#475569' },
  { min: 10,  max: 25,  label: 'Beginner',    emoji: '🌱', color: '#64748b' },
  { min: 25,  max: 45,  label: 'Novice',      emoji: '📘', color: '#2563eb' },
  { min: 45,  max: 65,  label: 'Intermediate',emoji: '⚡', color: '#d97706' },
  { min: 65,  max: 80,  label: 'Advanced',    emoji: '🔥', color: '#ea580c' },
  { min: 80,  max: 95,  label: 'Expert',      emoji: '💎', color: '#7c3aed' },
  { min: 95,  max: 101, label: 'Master',      emoji: '👑', color: '#059669' },
];

function getLevel(pct) {
  return LEVELS.find(l => pct >= l.min && pct < l.max) || LEVELS[0];
}
const STATUS = [
  { key: 'reading',   label: 'Reading',   variant: 'info' },
  { key: 'learning',  label: 'Learning',  variant: 'info' },
  { key: 'completed', label: 'Completed', variant: 'success' },
  { key: 'paused',    label: 'Paused',    variant: 'warning' },
  { key: 'wishlist',  label: 'Wishlist',  variant: 'neutral' },
];

const FILTER_ACTIVE = {
  primary: 'bg-primary/10 border-primary/30 text-primary',
  info: 'bg-info/10 border-info/30 text-info',
  success: 'bg-accent/10 border-accent/30 text-accent',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  neutral: 'bg-secondary/10 border-secondary/30 text-secondary',
};

const EMPTY_FORM = { title: '', author: '', total_pages: '', status: 'reading', rating: 0, notes: '', type: 'book', duration: '', start_date: '', end_date: '' };

export default function BooksTracker() {
  const toast = useToast();
  const [books, setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState({});
  const [stagesModal, setStagesModal] = useState(null);
  const [newStage, setNewStage] = useState({ label: '', done: false });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('books_tracker').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
    setLoading(false);
  };

  const saveNote = async (id) => {
    await supabase.from('books_tracker').update({ notes: noteText[id] ?? '' }).eq('id', id);
    await load();
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, total_pages: parseInt(form.total_pages) || null, current_page: form.current_page ? parseInt(form.current_page) : 0, duration: form.duration || null, start_date: form.start_date || null, end_date: form.end_date || null };
    if (editing) {
      await supabase.from('books_tracker').update(payload).eq('id', editing);
      setEditing(null);
      toast.success('Book updated');
    } else {
      await supabase.from('books_tracker').insert({ ...payload, current_page: 0 });
      toast.success('Book added');
    }
    setForm(EMPTY_FORM);
    setAdding(false);
    await load();
  };

  const startEdit = (book) => {
    setForm({ title: book.title, author: book.author || '', total_pages: book.total_pages || '', status: book.status, rating: book.rating || 0, notes: book.notes || '', type: book.type || 'book', duration: book.duration || '', start_date: book.start_date || '', end_date: book.end_date || '' });
    setEditing(book.id);
    setAdding(true);
  };

  const addStage = async (book) => {
    if (!newStage.label.trim()) return;
    const stages = [...(book.stages || []), { label: newStage.label, done: false }];
    await supabase.from('books_tracker').update({ stages }).eq('id', book.id);
    setNewStage({ label: '', done: false });
    await load();
    setStagesModal(prev => ({ ...prev, stages }));
  };

  const toggleStage = async (book, idx) => {
    const stages = book.stages.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    await supabase.from('books_tracker').update({ stages }).eq('id', book.id);
    await load();
    setStagesModal(prev => ({ ...prev, stages }));
  };

  const deleteStage = async (book, idx) => {
    const stages = book.stages.filter((_, i) => i !== idx);
    await supabase.from('books_tracker').update({ stages }).eq('id', book.id);
    await load();
    setStagesModal(prev => ({ ...prev, stages }));
  };

  const updateProgress = async (id, current_page, total_pages) => {
    const status = current_page >= total_pages ? 'completed' : 'reading';
    await supabase.from('books_tracker').update({ current_page, status }).eq('id', id);
    await load();
  };

  const deleteBook = async (id) => {
    await supabase.from('books_tracker').delete().eq('id', id);
    await load();
  };

  const confirmDeleteBook = async () => {
    if (!deleteTarget) return;
    await deleteBook(deleteTarget.id);
    toast.success('Book removed');
    setDeleteTarget(null);
  };

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);
  const stats = { total: books.length, completed: books.filter(b => b.status === 'completed').length, reading: books.filter(b => b.status === 'reading').length };

  // compute overall completion pct per book (pages OR stages OR status)
  const getBookPct = (book) => {
    if (book.status === 'completed') return 100;
    if (book.total_pages > 0) return Math.min(100, Math.round((book.current_page / book.total_pages) * 100));
    if (book.stages?.length > 0) return Math.round((book.stages.filter(s => s.done).length / book.stages.length) * 100);
    if (book.status === 'wishlist') return 0;
    if (book.status === 'paused') return 10;
    return 5;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
          <BookOpen size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Books &amp; Courses</h1>
        <p className="text-sm text-[var(--text-muted)]">Read, learn, and grow — track every book and course.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Completed', value: stats.completed },
          { label: 'Reading', value: stats.reading },
        ].map((s, i) => (
          <Card key={i}>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-[var(--text)] mb-1">{s.value}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wide">{s.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ key: 'all', label: 'All', variant: 'primary' }, ...STATUS].map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              filter === s.key ? FILTER_ACTIVE[s.variant] : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {s.label}
          </button>
        ))}
        <Button variant="primary" size="sm" className="ml-auto" icon={<Plus size={14} />} onClick={() => setAdding(true)}>
          Add
        </Button>
      </div>

      {/* Books List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen size={20} />}
            title="No books here yet"
            message="Add a book, course, podcast, or video series to start tracking your progress."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((book) => {
            const st = STATUS.find(s => s.key === book.status);
            const pct = book.total_pages ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
            const bookPct = getBookPct(book);
            const level = getLevel(bookPct);
            return (
              <div key={book.id}>
                <Card>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={st?.variant || 'neutral'}>{st?.label}</Badge>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: level.color + '15', border: `1px solid ${level.color}30`, color: level.color }}
                          >
                            {level.emoji} {level.label}
                          </span>
                          <span className="text-xs font-medium" style={{ color: level.color }}>{bookPct}%</span>
                        </div>
                        <h3 className="font-semibold text-[var(--text)] truncate">{book.title}</h3>
                        {book.author && <p className="text-xs text-[var(--text-muted)] mt-0.5">{book.author}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {book.rating > 0 && (
                          <div className="flex gap-0.5 mr-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <Star key={v} size={12} fill={v <= book.rating ? '#f59e0b' : 'transparent'} className={v <= book.rating ? 'text-warning' : 'text-[var(--border)]'} />
                            ))}
                          </div>
                        )}
                        <IconButton label="Update stages" onClick={() => { setStagesModal({ ...book }); setNewStage({ label: '', done: false }); }}>
                          <Layers size={14} />
                        </IconButton>
                        <IconButton label="Notes" onClick={() => { setNoteModal(book); setNoteText(n => ({ ...n, [book.id]: book.notes || '' })); }}>
                          <StickyNote size={14} />
                        </IconButton>
                        <IconButton label="Edit" onClick={() => startEdit(book)}>
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton label="Delete" variant="danger" onClick={() => setDeleteTarget(book)}>
                          <X size={14} />
                        </IconButton>
                      </div>
                    </div>

                    {/* Duration & Dates */}
                    {(book.duration || book.start_date || book.end_date) && (
                      <div className="flex flex-wrap gap-3 mb-3 text-xs text-[var(--text-muted)]">
                        {book.duration && <span className="flex items-center gap-1"><Clock size={12} />{book.duration}</span>}
                        {book.start_date && <span className="flex items-center gap-1"><Calendar size={12} />Start: {book.start_date}</span>}
                        {book.end_date && <span className="flex items-center gap-1"><Calendar size={12} />End: {book.end_date}</span>}
                      </div>
                    )}

                    {/* Stages mini preview */}
                    {book.stages?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {book.stages.map((s, si) => (
                          <span
                            key={si}
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              s.done ? 'bg-accent/10 border-accent/30 text-accent line-through' : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]'
                            }`}
                          >
                            {s.done ? '✓ ' : ''}{s.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {book.total_pages > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>Progress</span>
                          <span className="font-medium text-[var(--text)]">{book.current_page} / {book.total_pages} · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={book.total_pages}
                            defaultValue={book.current_page}
                            onBlur={e => updateProgress(book.id, parseInt(e.target.value) || 0, book.total_pages)}
                            className="w-20 h-9"
                          />
                          <span className="text-xs text-[var(--text-muted)]">current page</span>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={adding}
        onClose={closeForm}
        title={editing ? 'Edit Book / Course' : 'Add New Book / Course'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editing ? 'Update' : 'Save'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
          <Input label="Author / Creator" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author / Creator" />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="book">📖 Book</option>
            <option value="course">🎓 Course</option>
            <option value="podcast">🎙️ Podcast</option>
            <option value="video">🎬 Video Series</option>
          </Select>
          <Input
            label={form.type === 'book' ? 'Total pages' : form.type === 'course' ? 'Total lessons' : 'Total episodes'}
            type="number"
            value={form.total_pages}
            onChange={e => setForm(f => ({ ...f, total_pages: e.target.value }))}
          />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </Select>
          <Input
            label="Duration"
            value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            placeholder={form.type === 'book' ? 'e.g. 2 weeks' : 'e.g. 10 hours'}
          />
          <DateField label="Start date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          <DateField label="End date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
        </div>
        <div className="mt-4">
          <Textarea
            label="Notes (optional)"
            rows={3}
            value={form.notes || ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
          />
        </div>
      </Modal>

      {/* Stages Modal */}
      <Modal
        open={!!stagesModal}
        onClose={() => setStagesModal(null)}
        title={stagesModal?.title}
        size="md"
      >
        {stagesModal && (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {stagesModal.type === 'course' ? 'Course Modules' : stagesModal.type === 'podcast' ? 'Episodes' : stagesModal.type === 'video' ? 'Videos' : 'Chapters'}
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {(stagesModal.stages || []).length === 0 && (
                <p className="text-[var(--text-muted)] text-sm text-center py-4">No stages yet. Add one below.</p>
              )}
              {(stagesModal.stages || []).map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.done ? 'bg-accent/5 border-accent/30' : 'bg-[var(--surface-hover)] border-[var(--border)]'}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleStage(stagesModal, i)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      s.done ? 'bg-accent/20 border-accent text-accent' : 'bg-[var(--surface)] border-[var(--border)]'
                    }`}
                  >
                    {s.done && <Check size={10} />}
                  </button>
                  <span className={`flex-1 text-sm ${s.done ? 'text-accent line-through' : 'text-[var(--text)]'}`}>{s.label}</span>
                  <IconButton label="Delete stage" variant="danger" size="sm" onClick={() => deleteStage(stagesModal, i)}>
                    <X size={12} />
                  </IconButton>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newStage.label}
                onChange={e => setNewStage(s => ({ ...s, label: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addStage(stagesModal)}
                placeholder={stagesModal.type === 'course' ? 'Module / Lesson name...' : stagesModal.type === 'podcast' ? 'Episode name...' : stagesModal.type === 'video' ? 'Video name...' : 'Chapter name...'}
                className="flex-1"
              />
              <Button variant="primary" onClick={() => addStage(stagesModal)}>
                <Plus size={14} />
              </Button>
            </div>

            {(stagesModal.stages || []).length > 0 && (
              <div className="text-center text-xs text-[var(--text-muted)]">
                {(stagesModal.stages || []).filter(s => s.done).length} / {(stagesModal.stages || []).length} completed
                <div className="h-1 bg-[var(--surface-hover)] rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.round(((stagesModal.stages || []).filter(s => s.done).length / (stagesModal.stages || []).length) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        open={!!noteModal}
        onClose={() => setNoteModal(null)}
        title={noteModal ? `Notes — ${noteModal.title}` : 'Notes'}
        size="lg"
        footer={
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => { await saveNote(noteModal.id); toast.success('Note saved'); setNoteModal(null); }}
          >
            Save Note
          </Button>
        }
      >
        {noteModal && (
          <Textarea
            autoFocus
            rows={12}
            autoResize={false}
            value={noteText[noteModal.id] ?? ''}
            onChange={e => setNoteText(n => ({ ...n, [noteModal.id]: e.target.value }))}
            placeholder="Write your notes here..."
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteBook}
        title="Delete book"
        message={`Delete "${deleteTarget?.title}" and all of its notes and stages? This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
