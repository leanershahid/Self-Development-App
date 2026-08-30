import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, X, Check, Trophy, Zap } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const COLORS = ['#f87171','#fb923c','#facc15','#4ade80','#22d3ee','#818cf8','#e879f9','#f472b6'];
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
  const [habits, setHabits]   = useState([]);
  const [logs, setLogs]       = useState({});
  const [newHabit, setNewHabit] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [adding, setAdding]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: h } = await supabase.from('habits').select('*').eq('active', true).order('created_at');
    const { data: l } = await supabase.from('habit_logs').select('*').gte('date', (() => { const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().split('T')[0]; })());
    const logMap = {};
    (l || []).forEach(log => {
      if (!logMap[log.habit_id]) logMap[log.habit_id] = [];
      logMap[log.habit_id].push(log);
    });
    setHabits(h || []);
    setLogs(logMap);
  };

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await supabase.from('habits').insert({ name: newHabit.trim(), color: newColor, active: true });
    setNewHabit(''); setAdding(false);
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

  const deleteHabit = async (id) => {
    await supabase.from('habits').update({ active: false }).eq('id', id);
    await loadAll();
  };

  // last 14 days for mini heatmap
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-orange-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-rose-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-orange-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(251,146,60,0.2)' }}>
            <Flame size={32} className="text-orange-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-orange-500 mb-2">HABIT STREAKS</h1>
          <p className="text-orange-400/50 font-mono text-xs tracking-[0.3em] uppercase">Build · Track · Dominate</p>
        </motion.div>

        {/* Add Habit */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-3xl p-6 mb-6" style={GLASS}>
          <AnimatePresence>
            {adding ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()}
                  placeholder="Habit name (e.g. Morning Run, Read 30min...)"
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">Color:</span>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)} className="w-6 h-6 rounded-full transition-all"
                        style={{ background: c, boxShadow: newColor === c ? `0 0 10px ${c}` : 'none', transform: newColor === c ? 'scale(1.3)' : 'scale(1)' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addHabit} className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                    style={{ background: newColor + '20', border: `1px solid ${newColor}50`, color: newColor }}>Add Habit</button>
                  <button onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}><X size={16} /></button>
                </div>
              </motion.div>
            ) : (
              <button onClick={() => setAdding(true)} className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', color: '#fb923c' }}>
                <Plus size={18} /> New Habit
              </button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit, i) => {
            const habitLogs = logs[habit.id] || [];
            const streak = calcStreak(habitLogs);
            const todayDone = habitLogs.find(l => l.date === today)?.done;
            const totalDone = habitLogs.filter(l => l.done).length;
            const bestStreak = Math.max(streak, ...habitLogs.map((_, idx) => {
              let s = 0, cur = new Date(habitLogs[idx]?.date);
              for (let j = idx; j < habitLogs.length; j++) {
                if (habitLogs[j].done) s++; else break;
              }
              return s;
            }), 0);

            return (
              <motion.div key={habit.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="rounded-3xl p-6" style={{ ...GLASS, borderColor: habit.color + '20' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: habit.color, boxShadow: `0 0 8px ${habit.color}` }} />
                    <div>
                      <h3 className="font-bold text-slate-200">{habit.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-slate-500">{totalDone} total completions</span>
                        {streak > 0 && <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: habit.color }}><Flame size={10} /> {streak}d streak</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleToday(habit.id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={todayDone
                        ? { background: habit.color + '25', border: `2px solid ${habit.color}`, boxShadow: `0 0 12px ${habit.color}40` }
                        : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.1)' }}>
                      {todayDone ? <Check size={18} style={{ color: habit.color }} /> : <Check size={18} className="text-slate-600" />}
                    </button>
                    <button onClick={() => deleteHabit(habit.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)' }}><X size={14} /></button>
                  </div>
                </div>

                {/* 14-day mini heatmap */}
                <div className="flex gap-1.5 mt-2">
                  {last14.map((date, di) => {
                    const log = habitLogs.find(l => l.date === date);
                    return (
                      <div key={di} title={date} className="flex-1 h-6 rounded-md transition-all hover:scale-110"
                        style={{ background: log?.done ? habit.color : 'rgba(255,255,255,0.04)', boxShadow: log?.done ? `0 0 6px ${habit.color}60` : 'none' }} />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-700 font-mono">14 days ago</span>
                  <span className="text-[9px] text-slate-700 font-mono">today</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Current', value: `${streak}d`, icon: <Flame size={12} /> },
                    { label: 'Best', value: `${bestStreak}d`, icon: <Trophy size={12} /> },
                    { label: 'Total', value: totalDone, icon: <Zap size={12} /> },
                  ].map((s, si) => (
                    <div key={si} className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: habit.color }}>{s.icon}<span className="text-xs font-bold">{s.value}</span></div>
                      <div className="text-[9px] text-slate-600 font-mono uppercase">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {habits.length === 0 && (
            <div className="text-center py-16 rounded-3xl" style={GLASS}>
              <Flame className="text-slate-700 mx-auto mb-3" size={40} />
              <p className="text-slate-500 font-mono text-sm">No habits yet. Add your first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
