import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Star, Shield, Crown, Flame, Award, TrendingUp, Check } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, KpiCard, SkeletonCard } from './ui';
import { supabase } from '../supabase';
import { buildDayMap, computeStreaks } from '../utils/todoStats';

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
  { level: 10, title: 'God Mode',    xpRequired: 5000, color: '#1E3A5F', icon: <Crown size={24} /> },
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
  { id: 'level_10',      label: 'God Mode',        desc: 'Reach Level 10',                   icon: '👑', color: '#1E3A5F',  condition: (s) => s.level >= 10 },
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
  // eslint-disable-next-line no-unused-vars -- retained for parity with existing xp-log computation; not rendered in this view
  const [recentXP, setRecentXP] = useState([]);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data: todos } = await supabase.from('ToDo').select('*').order('created_at');
    const active = (todos || []).filter(t => t.active);
    const completed = active.filter(t => t.completed);

    // XP: 10 per completed todo, bonus for streaks
    const dayMap = buildDayMap(todos);
    const sortedDays = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0]));

    let totalXP = 0, hasPerfectDay = false;
    const xpLog = [];

    sortedDays.forEach(([date, day]) => {
      const pct = day.total > 0 ? day.done / day.total : 0;
      const dayXP = Math.round(day.done * 10 + pct * 50);
      totalXP += dayXP;
      xpLog.push({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xp: dayXP, cumulative: totalXP });
      if (pct === 1) hasPerfectDay = true;
    });

    const { bestStreak, currentStreak } = computeStreaks(dayMap, 50);

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const unlockedBadges = BADGES.filter(b => b.condition(stats));
  const lockedBadges = BADGES.filter(b => !b.condition(stats));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <Card>
        <CardHeader icon={<Crown size={18} />} title="Level System" subtitle="XP · Levels · Badges" />
      </Card>

      {/* Current level */}
      <Card>
        <CardBody className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: stats.currentLevel.color + '1a', border: `1px solid ${stats.currentLevel.color}40` }}
          >
            <span style={{ color: stats.currentLevel.color }}>{stats.currentLevel.icon}</span>
          </div>
          <div className="mb-1">
            <Badge variant="primary">Level {stats.currentLevel.level}</Badge>
          </div>
          <div className="text-3xl font-bold text-[var(--text)] mb-1">{stats.currentLevel.title}</div>
          <div className="text-lg text-[var(--text-muted)] mb-6">{stats.totalXP.toLocaleString()} XP</div>

          {stats.currentLevel.level < 10 && (
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>{stats.currentLevel.title}</span>
                <span>{stats.xpToNext} XP to {stats.nextLevel.title}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${stats.levelProgress}%` }} />
              </div>
              <div className="text-right text-xs text-[var(--text-muted)] mt-1">{stats.levelProgress}%</div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Zap size={18} />} label="Total XP" value={stats.totalXP.toLocaleString()} tone="accent" />
        <KpiCard icon={<Trophy size={18} />} label="Completed" value={stats.totalCompleted} tone="primary" />
        <KpiCard icon={<Flame size={18} />} label="Best Streak" value={`${stats.bestStreak}d`} tone="warning" />
        <KpiCard icon={<Award size={18} />} label="Badges" value={unlockedBadges.length} tone="accent" />
      </div>

      {/* Level Roadmap */}
      <Card>
        <CardHeader icon={<TrendingUp size={18} />} title="Level Roadmap" />
        <CardBody className="flex flex-col gap-2">
          {LEVELS.map((l, i) => {
            const unlocked = stats.totalXP >= l.xpRequired;
            const isCurrent = l.level === stats.currentLevel.level;
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg border"
                style={{
                  background: isCurrent ? l.color + '0d' : 'transparent',
                  borderColor: isCurrent ? l.color + '40' : 'var(--border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: unlocked ? l.color + '1a' : 'var(--surface-hover)',
                    color: unlocked ? l.color : 'var(--text-muted)',
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  {React.cloneElement(l.icon, { size: 16 })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: unlocked ? l.color : 'var(--text-muted)' }}>
                      Lv.{l.level} {l.title}
                    </span>
                    {isCurrent && <Badge variant="primary">Current</Badge>}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{l.xpRequired.toLocaleString()} XP</span>
                </div>
                {unlocked && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: l.color + '1a', border: `1px solid ${l.color}` }}>
                    <Check size={12} style={{ color: l.color }} />
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader icon={<Award size={18} />} title={`Badges (${unlockedBadges.length}/${BADGES.length})`} />
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...unlockedBadges, ...lockedBadges].map((badge) => {
              const unlocked = unlockedBadges.includes(badge);
              return (
                <div
                  key={badge.id}
                  className="p-4 rounded-xl border"
                  style={{
                    background: unlocked ? badge.color + '0d' : 'transparent',
                    borderColor: unlocked ? badge.color + '40' : 'var(--border)',
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  <div className="text-2xl mb-2" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                  <div className="text-sm font-semibold mb-0.5" style={{ color: unlocked ? badge.color : 'var(--text-muted)' }}>{badge.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{badge.desc}</div>
                  {unlocked && (
                    <div className="mt-2 text-xs font-medium uppercase tracking-wider" style={{ color: badge.color }}>Unlocked</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
