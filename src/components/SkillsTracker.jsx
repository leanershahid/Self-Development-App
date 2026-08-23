import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Brain, Plus, X, TrendingUp, Star } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://quufeiwzsgiuwkeyjjns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg'
);

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const COLORS = ['#22d3ee','#818cf8','#4ade80','#f59e0b','#f87171','#e879f9','#fb923c','#a78bfa'];

export default function SkillsTracker() {
  const [skills, setSkills]     = useState([]);
  const [ratings, setRatings]   = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newGoal, setNewGoal]   = useState(10);
  const [adding, setAdding]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [rateVal, setRateVal]   = useState(5);
  const [rateNote, setRateNote] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: s } = await supabase.from('skills').select('*').eq('active', true).order('created_at');
    const { data: r } = await supabase.from('skill_ratings').select('*').order('rated_at', { ascending: true });
    setSkills(s || []);
    setRatings(r || []);
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    await supabase.from('skills').insert({ name: newSkill.trim(), color: newColor, active: true, goal_rating: newGoal });
    setNewSkill(''); setNewGoal(10); setAdding(false);
    await loadAll();
  };

  const rateSkill = async (skillId) => {
    await supabase.from('skill_ratings').insert({ skill_id: skillId, rating: rateVal, note: rateNote.trim() || null, rated_at: new Date().toISOString() });
    setRateNote(''); setSelected(null);
    await loadAll();
  };

  const deleteSkill = async (id) => {
    await supabase.from('skills').update({ active: false }).eq('id', id);
    await loadAll();
  };

  const getLatestRating = (skillId) => {
    const r = ratings.filter(r => r.skill_id === skillId);
    return r.length ? r[r.length - 1].rating : 0;
  };

  const getHistory = (skillId) => ratings.filter(r => r.skill_id === skillId).map(r => ({
    date: new Date(r.rated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rating: r.rating,
  }));

  const radarData = skills.map(s => ({ skill: s.name.length > 10 ? s.name.slice(0, 10) + '…' : s.name, value: getLatestRating(s.id) }));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-cyan-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(34,211,238,0.2)' }}>
            <Brain size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500 mb-2">SKILLS TRACKER</h1>
          <p className="text-cyan-400/50 font-mono text-xs tracking-[0.3em] uppercase">Rate · Track · Level Up</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Skills List */}
          <div className="space-y-4">
            {/* Add Skill */}
            <div className="rounded-3xl p-5" style={GLASS}>
              <AnimatePresence>
                {adding ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()}
                      placeholder="Skill name (e.g. React, Guitar, Chess...)"
                      className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus />
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setNewColor(c)} className="w-6 h-6 rounded-full transition-all"
                          style={{ background: c, boxShadow: newColor === c ? `0 0 10px ${c}` : 'none', transform: newColor === c ? 'scale(1.3)' : 'scale(1)' }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono">Goal:</span>
                      <input type="range" min={1} max={10} value={newGoal} onChange={e => setNewGoal(+e.target.value)} className="flex-1" />
                      <span className="text-sm font-bold w-6" style={{ color: newColor }}>{newGoal}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addSkill} className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider"
                        style={{ background: newColor + '20', border: `1px solid ${newColor}50`, color: newColor }}>Add</button>
                      <button onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl text-slate-500"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}><X size={16} /></button>
                    </div>
                  </motion.div>
                ) : (
                  <button onClick={() => setAdding(true)} className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                    <Plus size={18} /> Add Skill
                  </button>
                )}
              </AnimatePresence>
            </div>

            {skills.map((skill, i) => {
              const latest = getLatestRating(skill.id);
              const history = getHistory(skill.id);
              const prev = history.length >= 2 ? history[history.length - 2].rating : null;
              const trend = prev !== null ? latest - prev : 0;

              return (
                <motion.div key={skill.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="rounded-3xl p-5" style={{ ...GLASS, borderColor: skill.color + '20' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: skill.color, boxShadow: `0 0 6px ${skill.color}` }} />
                      <span className="font-bold text-slate-200">{skill.name}</span>
                      {trend !== 0 && (
                        <span className="text-[10px] font-mono" style={{ color: trend > 0 ? '#4ade80' : '#f87171' }}>
                          {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(selected === skill.id ? null : skill.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
                        style={{ background: skill.color + '15', border: `1px solid ${skill.color}40`, color: skill.color }}>
                        Rate
                      </button>
                      <button onClick={() => deleteSkill(skill.id)} className="text-slate-600 hover:text-rose-400 transition-all"><X size={14} /></button>
                    </div>
                  </div>

                  {/* Rating bar with goal marker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${latest * 10}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${skill.color}80, ${skill.color})`, boxShadow: `0 0 8px ${skill.color}60` }} />
                      {skill.goal_rating && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${skill.goal_rating * 10}%` }} />
                      )}
                    </div>
                    <span className="text-sm font-bold w-16 text-right" style={{ color: skill.color }}>
                      {latest}/{skill.goal_rating || 10}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 10 }).map((_, si) => (
                      <Star key={si} size={12} fill={si < latest ? skill.color : 'transparent'} style={{ color: si < latest ? skill.color : '#1e293b' }} />
                    ))}
                  </div>

                  {/* Rate input */}
                  <AnimatePresence>
                    {selected === skill.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-mono">Rating:</span>
                          <input type="range" min={1} max={10} value={rateVal} onChange={e => setRateVal(+e.target.value)} className="flex-1" />
                          <span className="text-sm font-bold w-6" style={{ color: skill.color }}>{rateVal}</span>
                        </div>
                        <input value={rateNote} onChange={e => setRateNote(e.target.value)} placeholder="Note (optional)..."
                          className="w-full px-3 py-2 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <button onClick={() => rateSkill(skill.id)} className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                          style={{ background: skill.color + '20', border: `1px solid ${skill.color}50`, color: skill.color }}>Save Rating</button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mini trend */}
                  {history.length > 1 && (
                    <div className="h-12 mt-2" style={{ background: 'rgba(8,14,30,0.5)', borderRadius: 8, padding: '4px 8px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history} margin={{ top: 2, right: 2, left: -30, bottom: 2 }}>
                          <Line type="monotone" dataKey="rating" stroke={skill.color} strokeWidth={1.5} dot={false} />
                          <YAxis domain={[0, 10]} hide />
                          <XAxis dataKey="date" hide />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Right: Radar */}
          <div className="space-y-4">
            {radarData.length >= 3 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl p-6 sticky top-4" style={GLASS}>
                <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Skills Radar</h2>
                <div className="h-72" style={{ background: 'rgba(8,14,30,0.7)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', padding: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
                      <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2}
                        dot={{ fill: '#22d3ee', r: 3 }} activeDot={{ r: 5, fill: '#22d3ee', stroke: '#EDE8F5' }} />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 10, color: '#22d3ee', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {skills.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-slate-400 flex-1">{s.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="w-1.5 h-3 rounded-sm" style={{ background: i < getLatestRating(s.id) ? s.color : 'rgba(255,255,255,0.05)' }} />
                        ))}
                      </div>
                      <span className="text-xs font-bold w-6 text-right" style={{ color: s.color }}>{getLatestRating(s.id)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
