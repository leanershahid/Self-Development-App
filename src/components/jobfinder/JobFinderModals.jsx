import React from 'react';
import { Check } from 'lucide-react';
import { Modal, Button, Textarea, ConfirmDialog } from '../ui';

export function AutoApplyOverlay({ autoApplyingAll, useAiCoverLetter, autoApplyProgress }) {
  return (
    <Modal open={autoApplyingAll} onClose={() => {}} title="Auto Applying...">
      <div className="text-center py-2">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full animate-ping bg-accent/20" />
          <div className="absolute inset-2 rounded-full animate-pulse bg-accent/15 border border-accent/40" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🚀</div>
        </div>
        <p className="text-xs font-medium mb-1" style={{ color: useAiCoverLetter ? 'var(--warning, #f59e0b)' : 'var(--primary, #1E3A5F)' }}>
          {useAiCoverLetter ? '✨ AI Cover Letter per job' : '📄 Base Cover Letter'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mb-1 truncate px-4">{autoApplyProgress.currentJob}</p>
        <p className="text-accent font-semibold text-sm mb-4">{autoApplyProgress.current} / {autoApplyProgress.total}</p>
        <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden mb-2">
          <div className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(autoApplyProgress.current / autoApplyProgress.total) * 100}%` }} />
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">{Math.round((autoApplyProgress.current / autoApplyProgress.total) * 100)}% complete</p>
      </div>
    </Modal>
  );
}

export function EditNotesModal({ editingApp, setEditingApp, editingAppData, notes, setNotes, updateNotes }) {
  return (
    <Modal
      open={!!editingApp}
      onClose={() => setEditingApp(null)}
      title="Application Notes"
      footer={
        <>
          <Button variant="secondary" onClick={() => setEditingApp(null)}>Cancel</Button>
          <Button variant="success" icon={<Check size={14} />} onClick={() => updateNotes(editingApp)}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {editingAppData?.cover_letter && (
          <div className="p-3 rounded-xl bg-warning/5 border border-warning/15">
            <p className="text-[11px] font-medium text-warning/70 uppercase tracking-wide mb-1">Cover Letter</p>
            <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap">{editingAppData.cover_letter}</p>
          </div>
        )}
        <Textarea
          label="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          autoResize={false}
          placeholder="Add notes about this application..."
        />
      </div>
    </Modal>
  );
}

export function DeleteAppDialog({ deleteTarget, setDeleteTarget, confirmDeleteApp }) {
  return (
    <ConfirmDialog
      open={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={confirmDeleteApp}
      title="Delete application"
      message={`Remove "${deleteTarget?.job_title}" at ${deleteTarget?.company} from your tracker? This cannot be undone.`}
      confirmLabel="Delete"
    />
  );
}
