import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Smile, TrendingUp, Calendar, Zap } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

const MOODS = [
  { value: 1, emoji: '😞', label: 'Terrible', color: '#f87171' },
  { value: 2, emoji: '😕', label: 'Bad',      color: '#fb923c' },
  { value: 3, emoji: '😐', label: 'Okay',     color: '#facc15' },
  { value: 4, emoji: '😊', label: 'Good',     color: '#4ade80' },
  { value: 5, emoji: '🔥', label: 'Amazing',  color: '#22d3ee' },
];

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

export default function MoodTracker() {
  const [history, setHistory]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [note, setNote]             = useState('');
  const [productivity, setProductivity] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('mood_tracker').select('*').order('date', { ascending: true });
    setHistory(data || []);
    const t = (data || []).find(d => d.date === today);
    if (t) { setTodayEntry(t); setSelected(t.mood); setProductivity(t.productivity ?? null); }
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
  const currentMood = MOODS.find(m => m.value === selected);

  // correlation with productivity
  const corr = history.map(d => {
    const prod = d.productivity ?? null;
    return { mood: d.mood, productivity: prod, date: d.date };
  }).filter(d => d.productivity !== null);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-yellow-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-pink-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-yellow-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(250,204,21,0.2)' }}>
            <Smile size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-yellow-500 mb-2">MOOD TRACKER</h1>
          <p className="text-yellow-400/50 font-mono text-xs tracking-[0.3em] uppercase">Daily Emotional Intelligence · Mood vs Productivity</p>
        </motion.div>

        {/* Today's Mood Picker */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-3xl p-8 mb-6" style={GLASS}>
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-6">How are you feeling today?</h2>
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setSelected(m.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300"
                style={selected === m.value
                  ? { background: m.color + '20', border: `2px solid ${m.color}`, boxShadow: `0 0 20px ${m.color}40`, transform: 'scale(1.1)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)' }}>
                <span className="text-4xl">{m.emoji}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: selected === m.value ? m.color : '#475569' }}>{m.label}</span>
              </button>
            ))}
          </div>
          {selected && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about your day... (optional)"
                  rows={2} className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={11} /> Productivity Level</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => setProductivity(productivity === v ? null : v)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                        style={productivity === v
                          ? { background: '#a78bfa30', border: '1px solid #a78bfa80', color: '#a78bfa' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={save} disabled={saving}
                  className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                  style={{ background: `linear-gradient(135deg, ${currentMood?.color}30, ${currentMood?.color}15)`, border: `1px solid ${currentMood?.color}50`, color: currentMood?.color }}>
                  {saving ? 'Saving...' : todayEntry ? 'Update Mood' : 'Log Mood'}
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Days Tracked', value: history.length, color: '#22d3ee' },
            { label: 'Avg Mood', value: `${avgMood}/5`, color: '#facc15' },
            { label: 'Best Streak', value: `${history.filter(d => d.mood >= 4).length}d`, color: '#4ade80' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
              className="rounded-2xl p-4 text-center" style={GLASS}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Mood History Chart */}
        {history.length > 1 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl p-6 mb-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Mood History</h2>
            <div className="h-52 rounded-xl p-3" style={{ background: 'rgba(8,14,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 10, color: '#facc15', fontSize: 12 }} />
                  <Area type="monotone" dataKey="mood" stroke="#facc15" strokeWidth={2} fill="url(#moodGrad)" dot={{ fill: '#facc15', r: 3 }} activeDot={{ r: 5, stroke: '#EDE8F5', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Mood vs Productivity Scatter */}
        {corr.length > 1 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="rounded-3xl p-6 mb-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Zap size={14} /> Mood vs Productivity</h2>
            <div className="h-52 rounded-xl p-3" style={{ background: 'rgba(8,14,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mood" name="Mood" domain={[1,5]} type="number" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} label={{ value: 'Mood', position: 'insideBottom', offset: -2, fill: '#334155', fontSize: 9 }} />
                  <YAxis dataKey="productivity" name="Productivity" domain={[1,5]} type="number" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} label={{ value: 'Productivity', angle: -90, position: 'insideLeft', fill: '#334155', fontSize: 9 }} />
                  <ZAxis range={[40, 40]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 12 }} />
                  <Scatter data={corr} fill="#a78bfa" fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Recent Log */}
        {history.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-3xl p-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Calendar size={14} /> Recent Entries</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              {[...history].reverse().slice(0, 20).map((d, i) => {
                const m = MOODS.find(x => x.value === d.mood);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-2xl">{m?.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: m?.color }}>{m?.label}</span>
                        <span className="text-[10px] text-slate-600 font-mono">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {d.note && <p className="text-[11px] text-slate-500 mt-0.5">{d.note}</p>}
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(v => <div key={v} className="w-1.5 h-4 rounded-full" style={{ background: v <= d.mood ? m?.color : 'rgba(255,255,255,0.06)' }} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
