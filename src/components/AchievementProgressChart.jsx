import React, { useEffect, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, EmptyState, SkeletonCard } from './ui';
import { fetchAchievementProgress } from '../utils/achievementStats';

// Visual companion to the Achievements page — custom progress bars (matching
// the same gradient-fill style used for budget ledgers elsewhere in the app,
// rather than a generic chart-library bar chart) so you can see at a glance
// which long-term goals are lagging, not just one rolled-up average number.
// Same progress formula/source as the Achievements page itself.
function barColor(percent) {
  if (percent >= 100) return '#10b981'; // accent — complete
  if (percent >= 50) return '#2563eb'; // info — on track
  return '#d97706'; // warning — behind
}

export default function AchievementProgressChart() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAchievementProgress().then((s) => { if (!cancelled) setStats(s); });
    return () => { cancelled = true; };
  }, []);

  if (!stats) return <SkeletonCard />;

  const sorted = [...stats.items].sort((a, b) => b.percent - a.percent);

  return (
    <Card>
      <CardHeader title="Achievement Progress" icon={<Medal size={18} />} />
      <CardBody className="flex flex-col gap-5">
        {sorted.length === 0 ? (
          <EmptyState icon={<Medal size={18} />} title="No achievements yet" message="Create a goal on the Achievements page to track progress here." />
        ) : (
          <>
            {/* Hero stat row */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Trophy size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[var(--text)] tabular-nums">{stats.avgPercent}%</span>
                  <span className="text-xs text-[var(--text-muted)]">avg progress</span>
                </div>
                <div className="h-1.5 mt-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.avgPercent}%`, background: barColor(stats.avgPercent) }}
                  />
                </div>
              </div>
              <Badge variant={stats.completed === stats.total ? 'success' : 'primary'}>
                {stats.completed}/{stats.total} completed
              </Badge>
            </div>

            {/* Per-achievement bars */}
            <div className="flex flex-col gap-3">
              {sorted.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-sm text-[var(--text)] truncate">{item.title}</span>
                    <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: barColor(item.percent) }}>
                      {item.percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(item.percent, 100)}%`, background: barColor(item.percent) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
