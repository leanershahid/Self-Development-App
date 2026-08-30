import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Zap, Trophy, Star, Shield, Crown, Flame, Award, TrendingUp } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const LEVELS = [
  { level: 1,  title: 'Novice',      xpRequired: 0,    color: '#94a3b8', icon: <Shield size={24} /> },
  { level: 2,  title: 'Apprentice',  xpRequired: 100,  color: '#4ade80', icon: <Star size={24} /> },
  { level: 3,  title: 'Warrior',     xpRequired: 250,  color: '#22d3ee', icon: <Zap size={24} /> },
  { level: 4,  title: 'Knight',      xpRequired: 500,  color: '#818cf8', icon: <Shield size={24} /> },
  { level: 5,  title: 'Champion',    xpRequired: 900,  color: '#f59e0b', icon: <Trophy size={24} /> },
  { level: 6,  title: 'Hero',        xpRequired: 1400, color: '#fb923c', icon: <Flame size={24} /> },
  { level: 7,  title: 'Legend',      xpRequired: 2000, color: '#f87171', icon: <Award size={24} /> },
  { level: 8,  title: 'Mythic',      xpRequired: 2800, color: '#e879f9', icon: <Crown size={24} /> },
  { level: 9,  title: 'Immortal',    xpRequired: 3800, color: '#f59e0b', icon: <Star size={24} /> },
  { level: 10, title: 'God Mode',    xpRequired: 5000, color: '#ffffff', icon: <Crown size={24} /> },
];

const BADGES = [
  { id: 'first_todo',    label: 'First Step',     desc: 'Complete your first todo',          icon: '🎯', color: '#4ade80',  condition: (s) => s.totalCompleted >= 1 },
  { id: 'ten_todos',     label: 'Getting Started', desc: 'Complete 10 todos',                icon: '⚡', color: '#22d3ee',  condition: (s) => s.totalCompleted >= 10 },
  { id: 'fifty_todos',   label: 'Grinder',         desc: 'Complete 50 todos',                icon: '🔥', color: '#fb923c',  condition: (s) => s.totalCompleted >= 50 },
  { id: 'hundred_todos', label: 'Century',         desc: 'Complete 100 todos',               icon: '💯', color: '#f59e0b',  condition: (s) => s.totalCompleted >= 100 },
  { id: 'streak_3',      label: 'On Fire',         desc: '3-day perfect streak',             icon: '🔥', color: '#f87171',  condition: (s) => s.bestStreak >= 3 },
  { id: 'streak_7',      label: 'Week Warrior',    desc: '7-day perfect streak',             icon: '⚔️', color: '#818cf8',  condition: (s) => s.bestStreak >= 7 },
  { id: 'streak_30',     label: 'Iron Will',       desc: '30-day perfect streak',            icon: '🛡️', color: '#e879f9',  condition: (s) => s.bestStreak >= 30 },
  { id: 'perfect_day',   label: 'Perfectionist',   desc: 'Complete 100% todos in a day',     icon: '✨', color: '#facc15',  condition: (s) => s.hasPerfectDay },
  { id: 'level_5',       label: 'Champion',        desc: 'Reach Level 5',                    icon: '🏆', color: '#f59e0b',  condition: (s) => s.level >= 5 },
  { id: 'level_10',      label: 'God Mode',        desc: 'Reach Level 10',                   icon: '👑', color: '#ffffff',  condition: (s) => s.level >= 10 },
];

function getLevel(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xpRequired) current = l; else break; }
  return current;
}

function getNextLevel(xp) {
  return LEVELS.find(l => l.xpRequired > xp) || LEVELS[LEVELS.length - 1];
}

export default function LevelSystem() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentXP, setRecentXP] = useState([]);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data: todos } = await supabase.from('ToDo').select('*').order('created_at');
    const active = (todos || []).filter(t => t.active);
    const completed = active.filter(t => t.completed);

    // XP: 10 per completed todo, bonus for streaks
    const dayMap = new Map();
    active.forEach(t => {
      const d = t.created_at.split('T')[0];
      if (!dayMap.has(d)) dayMap.set(d, { total: 0, done: 0 });
      const day = dayMap.get(d);
      day.total++;
      if (t.completed) day.done++;
    });

    let totalXP = 0, bestStreak = 0, currentStreak = 0, hasPerfectDay = false;
    const xpLog = [];
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let prevDate = null;

    sortedDays.forEach(([date, day]) => {
      const pct = day.total > 0 ? day.done / day.total : 0;
      const dayXP = Math.round(day.done * 10 + pct * 50);
      totalXP += dayXP;
      xpLog.push({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xp: dayXP, cumulative: totalXP });

      if (pct === 1) hasPerfectDay = true;
      if (pct >= 0.5) {
        const prev = prevDate ? new Date(prevDate) : null;
        const cur = new Date(date);
        if (prev && Math.round((cur - prev) / 86400000) === 1) currentStreak++;
        else currentStreak = 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else currentStreak = 0;
      prevDate = date;
    });

    const currentLevel = getLevel(totalXP);
    const nextLevel = getNextLevel(totalXP);
    const xpToNext = nextLevel.xpRequired - totalXP;
    const xpInLevel = totalXP - currentLevel.xpRequired;
    const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
    const levelProgress = currentLevel.level === 10 ? 100 : Math.round((xpInLevel / xpNeeded) * 100);

    setStats({ totalXP, totalCompleted: completed.length, bestStreak, currentStreak, hasPerfectDay, level: currentLevel.level, currentLevel, nextLevel, xpToNext, levelProgress });
    setRecentXP(xpLog.slice(-14));
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Navbar />
      <div className="w-10 h-10 border-4 border-amber-900 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  const unlockedBadges = BADGES.filter(b => b.condition(stats));
  const lockedBadges = BADGES.filter(b => !b.condition(stats));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-amber-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-yellow-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-amber-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
            <Crown size={32} className="text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-500 mb-2">LEVEL SYSTEM</h1>
          <p className="text-amber-400/50 font-mono text-xs tracking-[0.3em] uppercase">XP · Levels · Badges · Domination</p>
        </motion.div>

        {/* Level Card */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-8 mb-6 text-center relative overflow-hidden"
          style={{ ...GLASS, boxShadow: `0 0 60px ${stats.currentLevel.color}30, 0 8px 32px rgba(0,0,0,0.4)` }}>
          <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 50%, ${stats.currentLevel.color}, transparent 70%)` }} />
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
            style={{ background: stats.currentLevel.color + '20', border: `2px solid ${stats.currentLevel.color}50`, boxShadow: `0 0 30px ${stats.currentLevel.color}40` }}>
            <span style={{ color: stats.currentLevel.color }}>{stats.currentLevel.icon}</span>
          </div>
          <div className="text-xs font-mono uppercase tracking-[0.4em] mb-1" style={{ color: stats.currentLevel.color + '80' }}>Level {stats.currentLevel.level}</div>
          <div className="text-5xl font-black mb-1" style={{ color: stats.currentLevel.color, textShadow: `0 0 30px ${stats.currentLevel.color}60` }}>{stats.currentLevel.title}</div>
          <div className="text-2xl font-light text-slate-400 mb-6">{stats.totalXP.toLocaleString()} XP</div>

          {stats.currentLevel.level < 10 && (
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                <span>{stats.currentLevel.title}</span>
                <span>{stats.xpToNext} XP to {stats.nextLevel.title}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.levelProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: `linear-gradient(90deg, ${stats.currentLevel.color}80, ${stats.currentLevel.color})` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </motion.div>
              </div>
              <div className="text-right text-[10px] font-mono mt-1" style={{ color: stats.currentLevel.color }}>{stats.levelProgress}%</div>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total XP', value: stats.totalXP.toLocaleString(), color: '#f59e0b', icon: <Zap size={16} /> },
            { label: 'Completed', value: stats.totalCompleted, color: '#4ade80', icon: <Trophy size={16} /> },
            { label: 'Best Streak', value: `${stats.bestStreak}d`, color: '#f87171', icon: <Flame size={16} /> },
            { label: 'Badges', value: unlockedBadges.length, color: '#818cf8', icon: <Award size={16} /> },
          ].map((s, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-2xl p-4 text-center" style={GLASS}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Level Roadmap */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl p-6 mb-6" style={GLASS}>
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Level Roadmap</h2>
          <div className="space-y-2">
            {LEVELS.map((l, i) => {
              const unlocked = stats.totalXP >= l.xpRequired;
              const isCurrent = l.level === stats.currentLevel.level;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-all"
                  style={{ background: isCurrent ? l.color + '10' : 'rgba(255,255,255,0.02)', border: `1px solid ${isCurrent ? l.color + '40' : 'rgba(255,255,255,0.04)'}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: unlocked ? l.color + '20' : 'rgba(255,255,255,0.03)', border: `1px solid ${unlocked ? l.color + '40' : 'rgba(255,255,255,0.06)'}`, color: unlocked ? l.color : '#334155', opacity: unlocked ? 1 : 0.4 }}>
                    {React.cloneElement(l.icon, { size: 16 })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: unlocked ? l.color : '#334155' }}>Lv.{l.level} {l.title}</span>
                      {isCurrent && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>CURRENT</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{l.xpRequired.toLocaleString()} XP</span>
                  </div>
                  {unlocked && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: l.color + '20', border: `1px solid ${l.color}` }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                  </div>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-3xl p-6" style={GLASS}>
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Award size={14} /> Badges ({unlockedBadges.length}/{BADGES.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...unlockedBadges, ...lockedBadges].map((badge, i) => {
              const unlocked = unlockedBadges.includes(badge);
              return (
                <div key={badge.id} className="p-4 rounded-2xl transition-all"
                  style={{ background: unlocked ? badge.color + '10' : 'rgba(255,255,255,0.02)', border: `1px solid ${unlocked ? badge.color + '30' : 'rgba(255,255,255,0.04)'}`, opacity: unlocked ? 1 : 0.4 }}>
                  <div className="text-2xl mb-2" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: unlocked ? badge.color : '#334155' }}>{badge.label}</div>
                  <div className="text-[10px] text-slate-600">{badge.desc}</div>
                  {unlocked && <div className="mt-2 text-[9px] font-mono uppercase tracking-wider" style={{ color: badge.color }}>✓ Unlocked</div>}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
