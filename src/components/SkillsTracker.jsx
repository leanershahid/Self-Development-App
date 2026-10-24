import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { Brain, Plus, X, TrendingUp, Star, Trophy } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Button, IconButton, Input, KpiCard, EmptyState, SkeletonCard, ConfirmDialog, useToast } from './ui';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

const COLORS = ['#22d3ee', '#818cf8', '#4ade80', '#f59e0b', '#f87171', '#e879f9', '#fb923c', '#a78bfa'];
const ACCENT_HEX = '#10b981';

function levelInfo(rating) {
  if (rating >= 9) return { label: 'Expert', variant: 'success' };
  if (rating >= 7) return { label: 'Advanced', variant: 'primary' };
  if (rating >= 4) return { label: 'Intermediate', variant: 'info' };
  return { label: 'Beginner', variant: 'neutral' };
}

export default function SkillsTracker() {
  const toast = useToast();
  const [skills, setSkills]     = useState([]);
  const [ratings, setRatings]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newGoal, setNewGoal]   = useState(10);
  const [adding, setAdding]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [rateVal, setRateVal]   = useState(5);
  const [rateNote, setRateNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('skills').select('*').eq('active', true).order('created_at');
    const { data: r } = await supabase.from('skill_ratings').select('*').order('rated_at', { ascending: true });
    setSkills(s || []);
    setRatings(r || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    await supabase.from('skills').insert({ name: newSkill.trim(), color: newColor, active: true, goal_rating: newGoal });
    setNewSkill(''); setNewGoal(10); setAdding(false);
    toast.success('Skill added');
    await loadAll();
  };

  const rateSkill = async (skillId) => {
    await supabase.from('skill_ratings').insert({ skill_id: skillId, rating: rateVal, note: rateNote.trim() || null, rated_at: new Date().toISOString() });
    setRateNote(''); setSelected(null);
    toast.success('Rating saved');
    await loadAll();
  };

  const deleteSkill = async (id) => {
    await supabase.from('skills').update({ active: false }).eq('id', id);
    await loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSkill(deleteTarget.id);
    setDeleteTarget(null);
    toast.success('Skill removed');
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

  const avgLevel = skills.length ? (skills.reduce((sum, s) => sum + getLatestRating(s.id), 0) / skills.length).toFixed(1) : '0.0';
  const atGoal = skills.filter(s => getLatestRating(s.id) >= (s.goal_rating || 10)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
          <Brain size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Skills Tracker</h1>
        <p className="text-sm text-[var(--text-muted)]">Rate, track, and level up your skills.</p>
      </motion.div>

      {/* KPIs */}
      {!loading && skills.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={<Brain size={18} />} label="Total Skills" value={skills.length} tone="primary" />
          <KpiCard icon={<TrendingUp size={18} />} label="Average Level" value={avgLevel} unit="/ 10" tone="accent" />
          <KpiCard icon={<Trophy size={18} />} label="At Goal" value={atGoal} unit={`/ ${skills.length}`} tone="accent" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Skills List */}
        <div className="flex flex-col gap-4">
          {/* Add Skill */}
          <Card>
            <CardBody>
              <AnimatePresence>
                {adding ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                    <Input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill()}
                      placeholder="Skill name (e.g. React, Guitar, Chess...)"
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Goal: {newGoal}</span>
                      <input type="range" min={1} max={10} value={newGoal} onChange={e => setNewGoal(+e.target.value)} className="flex-1 accent-accent" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="accent" className="flex-1" onClick={addSkill}>Add Skill</Button>
                      <IconButton label="Cancel" onClick={() => setAdding(false)}>
                        <X size={16} />
                      </IconButton>
                    </div>
                  </motion.div>
                ) : (
                  <Button variant="primary" className="w-full" icon={<Plus size={18} />} onClick={() => setAdding(true)}>
                    Add Skill
                  </Button>
                )}
              </AnimatePresence>
            </CardBody>
          </Card>

          {loading ? (
            <div className="flex flex-col gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : skills.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Brain size={20} />}
                title="No skills yet"
                message="Add your first skill to start tracking your progress."
              />
            </Card>
          ) : (
            skills.map((skill, i) => {
              const latest = getLatestRating(skill.id);
              const goal = skill.goal_rating || 10;
              const history = getHistory(skill.id);
              const prev = history.length >= 2 ? history[history.length - 2].rating : null;
              const trend = prev !== null ? latest - prev : 0;
              const level = levelInfo(latest);

              return (
                <motion.div key={skill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card>
                    <CardBody>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: skill.color }} />
                          <span className="font-semibold text-[var(--text)] truncate">{skill.name}</span>
                          <Badge variant={level.variant}>{level.label}</Badge>
                          {trend !== 0 && (
                            <span className={`text-xs font-medium ${trend > 0 ? 'text-accent' : 'text-danger'}`}>
                              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant={selected === skill.id ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setSelected(selected === skill.id ? null : skill.id)}
                          >
                            Rate
                          </Button>
                          <IconButton variant="danger" label="Remove skill" onClick={() => setDeleteTarget(skill)}>
                            <X size={14} />
                          </IconButton>
                        </div>
                      </div>

                      {/* Rating bar with goal marker */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${latest * 10}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-accent"
                          />
                          {skill.goal_rating && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--text)]/30" style={{ left: `${skill.goal_rating * 10}%` }} />
                          )}
                        </div>
                        <span className="text-sm font-bold w-14 text-right text-[var(--text)]">
                          {latest}/{goal}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 10 }).map((_, si) => (
                          <Star
                            key={si}
                            size={12}
                            fill={si < latest ? ACCENT_HEX : 'transparent'}
                            className={si < latest ? 'text-accent' : 'text-[var(--border)]'}
                          />
                        ))}
                      </div>

                      {/* Rate input */}
                      <AnimatePresence>
                        {selected === skill.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-col gap-2 pt-3 border-t border-[var(--border)] overflow-hidden"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Rating: {rateVal}</span>
                              <input type="range" min={1} max={10} value={rateVal} onChange={e => setRateVal(+e.target.value)} className="flex-1 accent-accent" />
                            </div>
                            <Input
                              value={rateNote}
                              onChange={e => setRateNote(e.target.value)}
                              placeholder="Note (optional)..."
                            />
                            <Button variant="accent" onClick={() => rateSkill(skill.id)}>Save Rating</Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Mini trend */}
                      {history.length > 1 && (
                        <div className="h-12 mt-3 bg-[var(--surface-hover)] rounded-lg px-2 py-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 2, right: 2, left: -30, bottom: 2 }}>
                              <Line type="monotone" dataKey="rating" stroke={ACCENT_HEX} strokeWidth={1.5} dot={false} />
                              <YAxis domain={[0, 10]} hide />
                              <XAxis dataKey="date" hide />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right: Radar */}
        <div className="flex flex-col gap-4">
          {radarData.length >= 3 ? (
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <Card className="sticky top-4">
                <CardHeader title="Skills Radar" icon={<TrendingUp size={16} />} />
                <CardBody>
                  <div className="h-72 bg-[var(--surface-hover)] rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(245,247,250,0.12)" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#8b95a5', fontSize: 10 }} />
                        <Radar dataKey="value" stroke={ACCENT_HEX} fill={ACCENT_HEX} fillOpacity={0.15} strokeWidth={2}
                          dot={{ fill: ACCENT_HEX, r: 3 }} activeDot={{ r: 5, fill: ACCENT_HEX, stroke: '#ffffff' }} />
                        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(245,247,250,0.12)', borderRadius: 10, color: '#f5f7fa', fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {skills.map(s => (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-[var(--text-muted)] flex-1 truncate">{s.name}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, idx) => (
                            <div
                              key={idx}
                              className="w-1.5 h-3 rounded-sm"
                              style={{ background: idx < getLatestRating(s.id) ? ACCENT_HEX : 'var(--border)' }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold w-6 text-right text-[var(--text)]">{getLatestRating(s.id)}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ) : !loading && skills.length > 0 ? (
            <Card>
              <EmptyState
                icon={<TrendingUp size={20} />}
                title="Radar needs more data"
                message="Add at least 3 skills to see your skills radar chart."
              />
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove skill"
        message={`Remove "${deleteTarget?.name}" from your skills list? Past ratings will be kept, but it will no longer appear here.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
