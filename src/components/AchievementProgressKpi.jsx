import React, { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { KpiCard } from './ui';
import { fetchAchievementProgress } from '../utils/achievementStats';

// Drop-in KPI tile showing long-term Achievement progress (from the
// Achievements page's own target_value/achievement_logs data) alongside a
// page's ToDo-derived stats, so "how's my day/week" views also surface
// "how am I doing on my longer-term goals" without having to visit /achievements.
export default function AchievementProgressKpi({ tone = 'accent' }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAchievementProgress().then((s) => { if (!cancelled) setStats(s); });
    return () => { cancelled = true; };
  }, []);

  if (!stats) {
    return <KpiCard icon={<Medal size={18} />} label="Achievements" value="—" tone={tone} />;
  }

  if (stats.total === 0) {
    return <KpiCard icon={<Medal size={18} />} label="Achievements" value="No goals yet" tone={tone} />;
  }

  return (
    <KpiCard
      icon={<Medal size={18} />}
      label="Achievements"
      value={`${stats.completed}/${stats.total}`}
      unit="completed"
      tone={tone}
      footer={<span className="text-xs text-[var(--text-muted)]">{stats.avgPercent}% avg progress</span>}
    />
  );
}
