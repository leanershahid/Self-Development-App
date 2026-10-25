import React, { useEffect, useState } from 'react';
import { Inbox, Check, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { supabase } from '../supabase';
import { Card, IconButton, Badge, Tabs, EmptyState, SkeletonCard, useToast } from './ui';

// Triage screen for everything saved via the global Quick Capture button/shortcut.
// Captures start as 'inbox' and get resolved into either a real ToDo ('task')
// or dismissed ('archived') — nothing sits unactioned without the user seeing it.
export default function CaptureInbox() {
  const toast = useToast();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('inbox'); // inbox | archived
  const [busyId, setBusyId] = useState(null);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('quick_captures').select('*').order('created_at', { ascending: false });
    if (error) {
      setTableMissing(true);
      setCaptures([]);
    } else {
      setTableMissing(false);
      setCaptures(data || []);
    }
    setLoading(false);
  }

  async function convertToTask(capture) {
    setBusyId(capture.id);
    const { error: insertError } = await supabase.from('ToDo').insert({ title: capture.content });
    if (insertError) {
      toast.error('Failed to create task: ' + insertError.message);
      setBusyId(null);
      return;
    }
    await supabase.from('quick_captures').update({ status: 'task' }).eq('id', capture.id);
    await load();
    setBusyId(null);
    toast.success('Added to your tasks!');
  }

  async function archive(capture) {
    setBusyId(capture.id);
    await supabase.from('quick_captures').update({ status: 'archived' }).eq('id', capture.id);
    await load();
    setBusyId(null);
  }

  async function restore(capture) {
    setBusyId(capture.id);
    await supabase.from('quick_captures').update({ status: 'inbox' }).eq('id', capture.id);
    await load();
    setBusyId(null);
  }

  async function remove(capture) {
    setBusyId(capture.id);
    await supabase.from('quick_captures').delete().eq('id', capture.id);
    await load();
    setBusyId(null);
  }

  const inboxItems = captures.filter((c) => c.status === 'inbox');
  const archivedItems = captures.filter((c) => c.status === 'archived' || c.status === 'task');
  const visible = view === 'inbox' ? inboxItems : archivedItems;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
          <Inbox size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Capture Inbox</h1>
        <p className="text-sm text-[var(--text-muted)]">Triage everything you've quick-captured.</p>
      </div>

      {tableMissing && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <p className="text-sm text-warning">
            The <code>quick_captures</code> table doesn't exist in your Supabase project yet. Run{' '}
            <code>supabase/quick_capture.sql</code> once in the Supabase SQL editor, then reload this page.
          </p>
        </Card>
      )}

      <Tabs
        tabs={[
          { value: 'inbox', label: `Inbox (${inboxItems.length})` },
          { value: 'archived', label: 'Resolved' },
        ]}
        value={view}
        onChange={setView}
      />

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={22} />}
            title={view === 'inbox' ? 'Inbox zero!' : 'Nothing resolved yet'}
            message={view === 'inbox' ? 'Use the + button anywhere in the app (or Ctrl+Shift+C) to capture a thought.' : 'Tasks you convert or archive from the inbox show up here.'}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => (
            <Card key={c.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap break-words">{c.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-[var(--text-muted)]">{new Date(c.created_at).toLocaleString()}</span>
                  {c.status === 'task' && <Badge variant="success">Converted to task</Badge>}
                  {c.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {view === 'inbox' ? (
                  <>
                    <IconButton label="Convert to task" variant="accent" disabled={busyId === c.id} onClick={() => convertToTask(c)}>
                      <Check size={15} />
                    </IconButton>
                    <IconButton label="Archive" disabled={busyId === c.id} onClick={() => archive(c)}>
                      <Archive size={15} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    {c.status === 'archived' && (
                      <IconButton label="Restore to inbox" disabled={busyId === c.id} onClick={() => restore(c)}>
                        <ArchiveRestore size={15} />
                      </IconButton>
                    )}
                    <IconButton label="Delete permanently" variant="danger" disabled={busyId === c.id} onClick={() => remove(c)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
