import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs } from './ui';
import PerformanceDashboard from './PerformanceDashboard';
import LevelSystem from './LevelSystem';
import BossChallenge from './BossChallenge';
import RewardsDashboard from './RewardsDashboard';
import LifeSuccessRate from './LifeSuccessRate';
import WeeklyReportCard from './WeeklyReportCard';

// Consolidates 6 previously-separate pages (Performance, Level, Boss Challenges,
// Rewards, Life Success, Weekly Report) that all independently derived stats from
// the same ToDo table into one tabbed "Progress" page. Each tab still renders the
// original component unchanged — their underlying calculations (streaks, XP,
// completion %) were NOT unified in this pass because the three components
// (LevelSystem, BossChallenge, LifeSuccessRate) use three different, mutually
// inconsistent streak/completion formulas. Unifying them would silently change
// the numbers users currently see, so each tab intentionally keeps showing its
// own existing numbers until that reconciliation is explicitly approved.
const TABS = [
  { value: 'performance', label: 'Performance', Component: PerformanceDashboard },
  { value: 'level', label: 'Level', Component: LevelSystem },
  { value: 'boss', label: 'Challenges', Component: BossChallenge },
  { value: 'rewards', label: 'Rewards', Component: RewardsDashboard },
  { value: 'life-success', label: 'Life Success', Component: LifeSuccessRate },
  { value: 'report-card', label: 'Weekly Report', Component: WeeklyReportCard },
];

export default function ProgressHub() {
  const location = useLocation();
  const initialTab = TABS.some((t) => t.value === location.state?.tab) ? location.state.tab : 'performance';
  const [tab, setTab] = useState(initialTab);
  const Active = TABS.find((t) => t.value === tab)?.Component ?? PerformanceDashboard;

  return (
    <div className="space-y-6">
      <Tabs
        tabs={TABS.map(({ value, label }) => ({ value, label }))}
        value={tab}
        onChange={setTab}
      />
      <Active />
    </div>
  );
}
