import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Smile, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card, CardHeader, CardBody, Textarea, Button, KpiCard, EmptyState, SkeletonCard } from './ui';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

const MOODS = [
  { value: 1, emoji: '😞', label: 'Terrible', color: '#dc2626' },
  { value: 2, emoji: '😕', label: 'Bad',      color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Okay',     color: '#d97706' },
  { value: 4, emoji: '😊', label: 'Good',     color: '#10B981' },
  { value: 5, emoji: '🔥', label: 'Amazing',  color: '#047857' },
];

export default function MoodTracker() {
  const [history, setHistory]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [note, setNote]             = useState('');
  const [productivity, setProductivity] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading]       = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('mood_tracker').select('*').order('date', { ascending: true });
    setHistory(data || []);
    const t = (data || []).find(d => d.date === today);
    if (t) { setTodayEntry(t); setSelected(t.mood); setProductivity(t.productivity ?? null); }
    setLoading(false);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const payload = { date: today, mood: selected, note: note.trim() || null, productivity: productivity || null };
    if (todayEntry) {
      await supabase.from('mood_tracker').update(payload).eq('id', todayEntry.id);
    } else {
      await supabase.from('mood_tracker').insert(payload);
    }
    await load();
    setNote('');
    setSaving(false);
  };

  const avgMood = history.length ? (history.reduce((s, d) => s + d.mood, 0) / history.length).toFixed(1) : 0;
  const chartData = history.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), mood: d.mood }));

  // correlation with productivity
  const corr = history.map(d => {
    const prod = d.productivity ?? null;
    return { mood: d.mood, productivity: prod, date: d.date };
  }).filter(d => d.productivity !== null);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
          <Smile size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Mood Tracker</h1>
        <p className="text-sm text-[var(--text-muted)]">Daily emotional check-ins, mood vs. productivity.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* Today's Mood Picker */}
          <Card>
            <CardHeader title="How are you feeling today?" icon={<Smile size={16} />} />
            <CardBody className="flex flex-col gap-5">
              <div className="flex justify-center gap-3 flex-wrap">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelected(m.value)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200"
                    style={selected === m.value
                      ? { background: `${m.color}1a`, borderColor: m.color, transform: 'scale(1.08)' }
                      : { background: 'var(--surface-hover)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: selected === m.value ? m.color : 'var(--text-muted)' }}
                    >
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              {selected && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-4">
                    <Textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Add a note about your day... (optional)"
                      rows={2}
                      autoResize={false}
                    />
                    <div>
                      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Zap size={11} /> Productivity Level
                      </p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setProductivity(productivity === v ? null : v)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors duration-150 ${
                              productivity === v
                                ? 'bg-primary text-white border-primary'
                                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button variant="accent" className="w-full" loading={saving} disabled={saving} onClick={save}>
                      {todayEntry ? 'Update Mood' : 'Log Mood'}
                    </Button>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardBody>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Days Tracked" value={history.length} icon={<Calendar size={18} />} tone="primary" />
            <KpiCard label="Avg Mood" value={`${avgMood}/5`} icon={<Smile size={18} />} tone="accent" />
            <KpiCard label="Best Streak" value={`${history.filter(d => d.mood >= 4).length}d`} icon={<TrendingUp size={18} />} tone="accent" />
          </div>

          {/* Mood History Chart */}
          {history.length > 1 && (
            <Card>
              <CardHeader title="Mood History" icon={<TrendingUp size={16} />} />
              <CardBody>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,247,250,0.12)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(245,247,250,0.12)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#f5f7fa' }} />
                      <Area type="monotone" dataKey="mood" stroke="#10B981" strokeWidth={2} fill="url(#moodGrad)" dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Mood vs Productivity Scatter */}
          {corr.length > 1 && (
            <Card>
              <CardHeader title="Mood vs Productivity" icon={<Zap size={16} />} />
              <CardBody>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,247,250,0.12)" />
                      <XAxis dataKey="mood" name="Mood" domain={[1, 5]} type="number" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'Mood', position: 'insideBottom', offset: -2, fill: '#8b95a5', fontSize: 10 }} />
                      <YAxis dataKey="productivity" name="Productivity" domain={[1, 5]} type="number" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'Productivity', angle: -90, position: 'insideLeft', fill: '#8b95a5', fontSize: 10 }} />
                      <ZAxis range={[40, 40]} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0d1117', border: '1px solid rgba(245,247,250,0.12)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#f5f7fa' }} />
                      <Scatter data={corr} fill="#1E3A5F" fillOpacity={0.8} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Log */}
          <Card>
            <CardHeader title="Recent Entries" icon={<Calendar size={16} />} />
            {history.length === 0 ? (
              <EmptyState
                icon={<Smile size={20} />}
                title="No entries yet"
                message="Log today's mood above to start building your history."
              />
            ) : (
              <CardBody className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {[...history].reverse().slice(0, 20).map((d, i) => {
                  const m = MOODS.find(x => x.value === d.mood);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                      <span className="text-2xl">{m?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: m?.color }}>{m?.label}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {d.note && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{d.note}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map(v => (
                          <div key={v} className="w-1.5 h-4 rounded-full" style={{ background: v <= d.mood ? m?.color : 'var(--border)' }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
