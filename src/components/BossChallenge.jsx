import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Flame, Trophy, Zap, SkullIcon, Crown, Target } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://qwjujuvtfqahapohhfzs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI'
);
//dfdsfsdf
const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const BOSSES = [
  { id: 'week_warrior',  name: 'Week Warrior',   desc: '100% todos for 7 days straight',  days: 7,  threshold: 100, reward: '500 XP + Week Warrior Badge', color: '#22d3ee', icon: '⚔️', hp: 700 },
  { id: 'iron_month',    name: 'Iron Month',      desc: '80%+ todos for 30 days straight', days: 30, threshold: 80,  reward: '3000 XP + Iron Month Badge',  color: '#818cf8', icon: '🛡️', hp: 3000 },
  { id: 'perfect_week',  name: 'Perfectionist',   desc: '100% todos for 5 days in a row',  days: 5,  threshold: 100, reward: '300 XP + Perfectionist Badge', color: '#f59e0b', icon: '✨', hp: 500 },
  { id: 'comeback_king', name: 'Comeback King',   desc: '90%+ todos for 3 days after a 0% day', days: 3, threshold: 90, reward: '200 XP + Comeback Badge', color: '#4ade80', icon: '👑', hp: 300 },
];

export default function BossChallenge() {
  const [bossData, setBossData] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeBoss, setActiveBoss] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: todos } = await supabase.from('ToDo').select('*').order('created_at');
    const active = (todos || []).filter(t => t.active);

    const dayMap = new Map();
    active.forEach(t => {
      const d = t.created_at.split('T')[0];
      if (!dayMap.has(d)) dayMap.set(d, { total: 0, done: 0 });
      const day = dayMap.get(d);
      day.total++;
      if (t.completed) day.done++;
    });

    const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, d]) => ({
      date, pct: d.total > 0 ? Math.round((d.done / d.total) * 100) : 0, done: d.done, total: d.total,
    }));

    const results = BOSSES.map(boss => {
      let maxStreak = 0, curStreak = 0, streakDays = [];
      let bestStreakDays = [];

      if (boss.id === 'comeback_king') {
        // special: 3 days 90%+ after a 0% day
        let comboStreak = 0, comboStart = false;
        for (let i = 1; i < days.length; i++) {
          if (days[i - 1].pct === 0) comboStart = true;
          if (comboStart && days[i].pct >= 90) comboStreak++;
          else if (comboStart && days[i].pct < 90) { comboStart = false; comboStreak = 0; }
          maxStreak = Math.max(maxStreak, comboStreak);
        }
        curStreak = comboStreak;
      } else {
        for (const day of days) {
          if (day.pct >= boss.threshold) {
            curStreak++;
            streakDays.push(day);
            if (curStreak > maxStreak) { maxStreak = curStreak; bestStreakDays = [...streakDays]; }
          } else { curStreak = 0; streakDays = []; }
        }
      }

      const defeated = maxStreak >= boss.days;
      const progress = Math.min(100, Math.round((curStreak / boss.days) * 100));
      const hpRemaining = Math.max(0, boss.hp - Math.round((curStreak / boss.days) * boss.hp));

      return { ...boss, curStreak, maxStreak, defeated, progress, hpRemaining, bestStreakDays };
    });

    setBossData(results);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Navbar />
      <div className="w-10 h-10 border-4 border-rose-900 border-t-rose-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-rose-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-red-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-rose-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(248,113,113,0.2)' }}>
            <Sword size={32} className="text-rose-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-rose-500 mb-2">BOSS CHALLENGES</h1>
          <p className="text-rose-400/50 font-mono text-xs tracking-[0.3em] uppercase">Defeat Bosses · Earn Rewards · Prove Yourself</p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Bosses Defeated', value: bossData.filter(b => b.defeated).length, color: '#4ade80', icon: <Trophy size={16} /> },
            { label: 'In Progress', value: bossData.filter(b => !b.defeated && b.curStreak > 0).length, color: '#f59e0b', icon: <Flame size={16} /> },
            { label: 'Total Bosses', value: bossData.length, color: '#818cf8', icon: <Target size={16} /> },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={GLASS}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Boss Cards */}
        <div className="space-y-6">
          {bossData.map((boss, i) => (
            <motion.div key={boss.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="rounded-3xl p-6 relative overflow-hidden cursor-pointer"
              style={{ ...GLASS, borderColor: boss.defeated ? boss.color + '40' : boss.curStreak > 0 ? boss.color + '20' : 'rgba(255,255,255,0.06)', boxShadow: boss.defeated ? `0 0 30px ${boss.color}20` : 'none' }}
              onClick={() => setActiveBoss(activeBoss === boss.id ? null : boss.id)}>

              {/* Background glow */}
              <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 80% 50%, ${boss.color}, transparent 60%)` }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl" style={{ filter: boss.defeated ? 'none' : boss.curStreak > 0 ? 'none' : 'grayscale(0.5)' }}>{boss.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg" style={{ color: boss.defeated ? boss.color : '#3D52A0' }}>{boss.name}</h3>
                        {boss.defeated && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: boss.color + '20', border: `1px solid ${boss.color}40`, color: boss.color }}>DEFEATED</span>}
                        {!boss.defeated && boss.curStreak > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse" style={{ background: '#f59e0b20', border: '1px solid #f59e0b40', color: '#f59e0b' }}>IN BATTLE</span>}
                      </div>
                      <p className="text-xs text-slate-500">{boss.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-600 mb-1">HP</div>
                    <div className="text-lg font-bold" style={{ color: boss.defeated ? '#4ade80' : boss.color }}>
                      {boss.defeated ? '0' : boss.hpRemaining.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-mono text-slate-600 mb-1.5">
                    <span>Boss HP</span>
                    <span style={{ color: boss.color }}>{boss.curStreak}/{boss.days} days · {boss.progress}%</span>
                  </div>
                  <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${100 - boss.progress}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full absolute right-0"
                      style={{ background: boss.defeated ? '#1e293b' : `linear-gradient(90deg, ${boss.color}60, ${boss.color})`, boxShadow: boss.defeated ? 'none' : `0 0 10px ${boss.color}60` }}>
                    </motion.div>
                    {!boss.defeated && boss.progress > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-full bg-white/10 animate-pulse" style={{ marginLeft: `${100 - boss.progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-[10px] font-mono text-slate-400">{boss.reward}</span>
                  </div>
                  {boss.defeated && <Crown size={20} style={{ color: boss.color }} />}
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {activeBoss === boss.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/5 overflow-hidden">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Current Streak', value: `${boss.curStreak}d`, color: boss.color },
                          { label: 'Best Streak', value: `${boss.maxStreak}d`, color: '#f59e0b' },
                          { label: 'Required', value: `${boss.days}d`, color: '#818cf8' },
                        ].map((s, si) => (
                          <div key={si} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="text-lg font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[9px] text-slate-600 font-mono uppercase">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3 text-center font-mono">
                        {boss.defeated ? `🎉 Boss defeated! You earned: ${boss.reward}` : boss.curStreak > 0 ? `⚔️ Keep going! ${boss.days - boss.curStreak} more days to defeat this boss.` : `🎯 Start a ${boss.threshold}%+ completion streak to begin this challenge.`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
