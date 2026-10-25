import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Flame, Trophy, Zap, Crown, Target } from 'lucide-react';
import { Card, Badge, KpiCard, EmptyState, Skeleton, SkeletonCard } from './ui';
import { supabase } from '../supabase';
import { buildDayMap, computeStreaks, computeComebackStreak } from '../utils/todoStats';

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
    const dayMap = buildDayMap(todos);

    const results = BOSSES.map(boss => {
      const { bestStreak: maxStreak, currentStreak: curStreak } = boss.id === 'comeback_king'
        ? computeComebackStreak(dayMap, boss.threshold)
        : computeStreaks(dayMap, boss.threshold);

      const defeated = maxStreak >= boss.days;
      const progress = Math.min(100, Math.round((curStreak / boss.days) * 100));
      const hpRemaining = Math.max(0, boss.hp - Math.round((curStreak / boss.days) * boss.hp));

      return { ...boss, curStreak, maxStreak, defeated, progress, hpRemaining };
    });

    setBossData(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const defeatedCount = bossData.filter(b => b.defeated).length;
  const inProgressCount = bossData.filter(b => !b.defeated && b.curStreak > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
          <Sword size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Boss Challenges</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Defeat bosses, earn rewards, prove yourself</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Bosses Defeated" value={defeatedCount} icon={<Trophy size={18} />} tone="accent" />
        <KpiCard label="In Progress" value={inProgressCount} icon={<Flame size={18} />} tone="warning" />
        <KpiCard label="Total Bosses" value={bossData.length} icon={<Target size={18} />} tone="primary" />
      </div>

      {/* Boss Cards */}
      {bossData.length === 0 ? (
        <EmptyState
          icon={<Sword size={22} />}
          title="No boss data yet"
          message="Complete some todos to start tracking your boss challenge streaks."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {bossData.map((boss, i) => {
            const fillColor = boss.defeated ? '#10B981' : boss.color;
            return (
              <motion.div key={boss.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}>
                <Card
                  className="p-5 cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setActiveBoss(activeBoss === boss.id ? null : boss.id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 bg-[var(--bg)] border border-[var(--border)]"
                        style={{ filter: boss.defeated || boss.curStreak > 0 ? 'none' : 'grayscale(0.6)' }}
                      >
                        {boss.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-base text-[var(--text)]">{boss.name}</h3>
                          {boss.defeated && <Badge variant="success">Defeated</Badge>}
                          {!boss.defeated && boss.curStreak > 0 && <Badge variant="warning">In Battle</Badge>}
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{boss.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1">HP</div>
                      <div className="text-lg font-bold" style={{ color: boss.defeated ? '#10B981' : boss.color }}>
                        {boss.defeated ? '0' : boss.hpRemaining.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mb-1.5">
                      <span>Boss HP</span>
                      <span style={{ color: boss.color }}>{boss.curStreak}/{boss.days} days · {boss.progress}%</span>
                    </div>
                    <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${boss.defeated ? 100 : boss.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.08 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: fillColor }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                      <Zap size={12} className="text-warning" />
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{boss.reward}</span>
                    </div>
                    {boss.defeated && <Crown size={20} style={{ color: boss.color }} />}
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {activeBoss === boss.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-[var(--border)] overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Current Streak', value: `${boss.curStreak}d`, color: boss.color },
                            { label: 'Best Streak', value: `${boss.maxStreak}d`, color: '#f59e0b' },
                            { label: 'Required', value: `${boss.days}d`, color: '#818cf8' },
                          ].map((s, si) => (
                            <div key={si} className="text-center p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                              <div className="text-lg font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                              <div className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wide">{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-3 text-center font-mono">
                          {boss.defeated ? `Boss defeated! You earned: ${boss.reward}` : boss.curStreak > 0 ? `Keep going! ${boss.days - boss.curStreak} more days to defeat this boss.` : `Start a ${boss.threshold}%+ completion streak to begin this challenge.`}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
