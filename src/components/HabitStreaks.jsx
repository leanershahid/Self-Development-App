import React, { useState, useEffect } from 'react';
import { Flame, Plus, X, Check, Trophy, Zap } from 'lucide-react';
import { Card, CardBody, Badge, Button, IconButton, Input, EmptyState, SkeletonCard, ConfirmDialog, useToast } from './ui';
import { supabase } from '../supabase';

const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9', '#f472b6'];
const today = new Date().toISOString().split('T')[0];

function calcStreak(logs) {
  if (!logs?.length) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0, cur = new Date();
  for (const log of sorted) {
    const d = new Date(log.date);
    const diff = Math.round((cur - d) / 86400000);
    if (diff <= 1 && log.done) { streak++; cur = d; }
    else break;
  }
  return streak;
}

export default function HabitStreaks() {
  const toast = useToast();
  const [habits, setHabits]     = useState([]);
  const [logs, setLogs]         = useState({});
  const [newHabit, setNewHabit] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [adding, setAdding]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data: h } = await supabase.from('habits').select('*').eq('active', true).order('created_at');
    const { data: l } = await supabase.from('habit_logs').select('*').gte('date', (() => { const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().split('T')[0]; })());
    const logMap = {};
    (l || []).forEach(log => {
      if (!logMap[log.habit_id]) logMap[log.habit_id] = [];
      logMap[log.habit_id].push(log);
    });
    setHabits(h || []);
    setLogs(logMap);
    setLoading(false);
  };

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await supabase.from('habits').insert({ name: newHabit.trim(), color: newColor, active: true });
    setNewHabit(''); setAdding(false);
    toast.success('Habit added');
    await loadAll();
  };

  const toggleToday = async (habitId) => {
    const todayLog = (logs[habitId] || []).find(l => l.date === today);
    if (todayLog) {
      await supabase.from('habit_logs').update({ done: !todayLog.done }).eq('id', todayLog.id);
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habitId, date: today, done: true });
    }
    await loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('habits').update({ active: false }).eq('id', deleteTarget.id);
    setDeleteTarget(null);
    toast.success('Habit removed');
    await loadAll();
  };

  // last 14 days for mini heatmap
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
          <Flame size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Habit Streaks</h1>
        <p className="text-sm text-[var(--text-muted)]">Build, track, and keep your streak alive.</p>
      </div>

      {/* Add Habit */}
      <Card>
        <CardBody>
          {adding ? (
            <div className="flex flex-col gap-3">
              <Input
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHabit()}
                placeholder="Habit name (e.g. Morning Run, Read 30min...)"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">Color</span>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="w-6 h-6 rounded-full transition-transform"
                      style={{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px', transform: newColor === c ? 'scale(1.15)' : 'scale(1)' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="accent" className="flex-1" onClick={addHabit}>Add Habit</Button>
                <IconButton label="Cancel" onClick={() => setAdding(false)}>
                  <X size={16} />
                </IconButton>
              </div>
            </div>
          ) : (
            <Button variant="primary" className="w-full" icon={<Plus size={18} />} onClick={() => setAdding(true)}>
              New Habit
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Habits List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Flame size={20} />}
            title="No habits yet"
            message="Add your first habit to start building a streak."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map((habit) => {
            const habitLogs = logs[habit.id] || [];
            const streak = calcStreak(habitLogs);
            const todayDone = habitLogs.find(l => l.date === today)?.done;
            const totalDone = habitLogs.filter(l => l.done).length;
            const bestStreak = Math.max(streak, ...habitLogs.map((_, idx) => {
              let s = 0;
              for (let j = idx; j < habitLogs.length; j++) {
                if (habitLogs[j].done) s++; else break;
              }
              return s;
            }), 0);

            return (
              <Card key={habit.id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: habit.color }} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--text)] truncate">{habit.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-[var(--text-muted)]">{totalDone} total completions</span>
                          {streak > 0 && (
                            <Badge variant="success">
                              <Flame size={10} /> {streak}d streak
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleToday(habit.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors duration-150 ${
                          todayDone
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                        aria-label={todayDone ? 'Mark today as not done' : 'Mark today as done'}
                      >
                        <Check size={18} />
                      </button>
                      <IconButton variant="danger" label="Remove habit" onClick={() => setDeleteTarget(habit)}>
                        <X size={14} />
                      </IconButton>
                    </div>
                  </div>

                  {/* 14-day mini heatmap */}
                  <div className="flex gap-1.5">
                    {last14.map((date, di) => {
                      const log = habitLogs.find(l => l.date === date);
                      return (
                        <div
                          key={di}
                          title={date}
                          className="flex-1 h-6 rounded-md transition-transform hover:scale-110"
                          style={{ background: log?.done ? habit.color : 'var(--surface-hover)' }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">14 days ago</span>
                    <span className="text-[10px] text-[var(--text-muted)]">today</span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Current', value: `${streak}d`, icon: <Flame size={12} /> },
                      { label: 'Best', value: `${bestStreak}d`, icon: <Trophy size={12} /> },
                      { label: 'Total', value: totalDone, icon: <Zap size={12} /> },
                    ].map((s, si) => (
                      <div key={si} className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
                        <div className="flex items-center justify-center gap-1 mb-1 text-[var(--text)]">
                          {s.icon}<span className="text-xs font-bold">{s.value}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove habit"
        message={`Remove "${deleteTarget?.name}" from your habit list? Past logs will be kept, but it will no longer appear here.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
