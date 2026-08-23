import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ClipboardList, Award, TrendingUp, Calendar } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://quufeiwzsgiuwkeyjjns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg'
);

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

function getGrade(pct) {
  if (pct >= 95) return { grade: 'S', color: '#f59e0b', label: 'Legendary', glow: 'rgba(245,158,11,0.5)' };
  if (pct >= 85) return { grade: 'A+', color: '#22d3ee', label: 'Excellent', glow: 'rgba(34,211,238,0.4)' };
  if (pct >= 75) return { grade: 'A',  color: '#4ade80', label: 'Great',     glow: 'rgba(74,222,128,0.4)' };
  if (pct >= 65) return { grade: 'B+', color: '#818cf8', label: 'Good',      glow: 'rgba(129,140,248,0.4)' };
  if (pct >= 55) return { grade: 'B',  color: '#a78bfa', label: 'Above Avg', glow: 'rgba(167,139,250,0.4)' };
  if (pct >= 45) return { grade: 'C',  color: '#fb923c', label: 'Average',   glow: 'rgba(251,146,60,0.4)' };
  if (pct >= 35) return { grade: 'D',  color: '#f87171', label: 'Below Avg', glow: 'rgba(248,113,113,0.4)' };
  return { grade: 'F', color: '#ef4444', label: 'Failed', glow: 'rgba(239,68,68,0.4)' };
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export default function WeeklyReportCard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [allWeeks, setAllWeeks]     = useState([]);

  useEffect(() => { loadReport(weekOffset); }, [weekOffset]);
  useEffect(() => { loadAllWeeks(); }, []);

  const loadReport = async (offset) => {
    setLoading(true);
    const { start, end } = getWeekRange(offset);
    const { data: todos } = await supabase.from('ToDo').select('*')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    const { data: moods } = await supabase.from('mood_tracker').select('*')
      .gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]);

    const active = (todos || []).filter(t => t.active);
    const completed = active.filter(t => t.completed).length;
    const total = active.length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgMood = moods?.length ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length) : 0;
    const daysActive = new Set(active.map(t => t.created_at.split('T')[0])).size;
    const consistency = Math.round((daysActive / 7) * 100);

    // per-day breakdown
    const dayMap = {};
    active.forEach(t => {
      const d = t.created_at.split('T')[0];
      if (!dayMap[d]) dayMap[d] = { total: 0, done: 0 };
      dayMap[d].total++;
      if (t.completed) dayMap[d].done++;
    });
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const radarData = days.map((day, i) => {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const d = dayMap[key];
      return { day, rate: d ? Math.round((d.done / d.total) * 100) : 0 };
    });

    setReport({ completionPct, completed, total, avgMood, consistency, daysActive, radarData, start, end });
    setLoading(false);
  };

  const loadAllWeeks = async () => {
    const { data } = await supabase.from('ToDo').select('created_at, completed, active').order('created_at');
    if (!data?.length) return;
    const first = new Date(data[0].created_at);
    const now = new Date();
    const totalWeeks = Math.ceil((now - first) / (7 * 86400000));
    const weeks = [];
    for (let i = 0; i < Math.min(totalWeeks, 12); i++) {
      const { start, end } = getWeekRange(-i);
      const active = data.filter(t => t.active && new Date(t.created_at) >= start && new Date(t.created_at) <= end);
      const done = active.filter(t => t.completed).length;
      weeks.push({ offset: -i, pct: active.length ? Math.round((done / active.length) * 100) : 0, label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }
    setAllWeeks(weeks.reverse());
  };

  const { start, end } = getWeekRange(weekOffset);
  const dateLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-indigo-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(129,140,248,0.2)' }}>
            <ClipboardList size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-500 mb-2">WEEKLY REPORT CARD</h1>
          <p className="text-indigo-400/50 font-mono text-xs tracking-[0.3em] uppercase">Auto-Generated · Every Week · Your Grade</p>
        </motion.div>

        {/* Week Navigator */}
        <div className="flex items-center justify-between mb-6 rounded-2xl px-6 py-4" style={GLASS}>
          <button onClick={() => setWeekOffset(w => w - 1)} className="px-4 py-2 rounded-xl text-sm font-mono text-slate-400 hover:text-slate-200 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>← Prev</button>
          <div className="text-center">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ago`}</p>
            <p className="text-sm font-bold text-slate-300 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset === 0}
            className="px-4 py-2 rounded-xl text-sm font-mono transition-all disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>Next →</button>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-400 rounded-full animate-spin mx-auto" /></div>
        ) : report && (
          <>
            {/* Grade Card */}
            {(() => {
              const g = getGrade(report.completionPct);
              return (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="rounded-3xl p-8 mb-6 text-center relative overflow-hidden"
                  style={{ ...GLASS, boxShadow: `0 0 60px ${g.glow}, 0 8px 32px rgba(0,0,0,0.4)` }}>
                  <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 50%, ${g.color}, transparent 70%)` }} />
                  <p className="text-xs font-mono tracking-[0.4em] uppercase mb-2 text-slate-500">Weekly Grade</p>
                  <div className="text-9xl font-black mb-2" style={{ color: g.color, textShadow: `0 0 40px ${g.glow}` }}>{g.grade}</div>
                  <div className="inline-block px-5 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border mb-4"
                    style={{ color: g.color, borderColor: g.color + '50', background: g.color + '15' }}>{g.label}</div>
                  <div className="text-4xl font-light" style={{ color: g.color }}>{report.completionPct}%</div>
                  <p className="text-xs text-slate-500 font-mono mt-1">{report.completed} / {report.total} tasks completed</p>
                </motion.div>
              );
            })()}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Completion', value: `${report.completionPct}%`, color: '#22d3ee' },
                { label: 'Consistency', value: `${report.consistency}%`, color: '#4ade80' },
                { label: 'Avg Mood', value: report.avgMood ? `${report.avgMood.toFixed(1)}/5` : 'N/A', color: '#facc15' },
                { label: 'Active Days', value: `${report.daysActive}/7`, color: '#818cf8' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-4 text-center" style={GLASS}>
                  <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Radar Chart */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl p-6 mb-6" style={GLASS}>
              <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4">Daily Performance Radar</h2>
              <div className="h-64" style={{ background: 'rgba(8,14,30,0.7)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', padding: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={report.radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }} />
                    <Radar dataKey="rate" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={2}
                      dot={{ fill: '#818cf8', r: 3 }} activeDot={{ r: 5, fill: '#818cf8', stroke: '#EDE8F5' }} />
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 10, color: '#818cf8', fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* All Weeks History */}
            {allWeeks.length > 0 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-3xl p-6" style={GLASS}>
                <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Calendar size={14} /> Grade History</h2>
                <div className="space-y-2">
                  {allWeeks.map((w, i) => {
                    const g = getGrade(w.pct);
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03]"
                        style={{ border: '1px solid rgba(255,255,255,0.04)' }} onClick={() => setWeekOffset(w.offset)}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                          style={{ background: g.color + '20', border: `1px solid ${g.color}40`, color: g.color }}>{g.grade}</div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: g.color }} />
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 w-8 text-right">{w.pct}%</span>
                        <span className="text-[10px] font-mono text-slate-600 w-16 text-right">{w.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
