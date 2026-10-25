// Canonical ToDo-derived stats shared by every page under ProgressHub
// (Performance, Level, Challenges, Rewards tab excluded, Life Success, Weekly Report).
//
// Before this module existed, LevelSystem/BossChallenge/LifeSuccessRate/WeeklyReportCard/
// PerformanceDashboard each computed "completion %", "streak", and "this week" independently
// and disagreed with each other:
//   - active-row filtering was inconsistent (some filtered `active` before counting totals,
//     LifeSuccessRate counted inactive rows into `total` without ever landing in completed/failed)
//   - three different streak algorithms existed (50%-threshold with calendar-adjacency check,
//     per-boss-threshold with no calendar-gap check, and a trailing-only no-gap-check version)
//   - "overall completion %" had two formulas (true completed/total ratio vs. average of daily rates)
//   - "this week"/"this month" meant either a real Mon-Sun calendar week / calendar month, or a
//     7-day/30-day block anchored to the very first ToDo ever created
//
// This module picks ONE answer for each and every consumer now uses it:
//   - active filtering: only `t.active` rows count toward total/completed/failed
//   - overall rate: true ratio (totalCompleted / totalTasks), not an average of daily rates
//   - streaks: calendar-day-aware — a day with no recorded rows counts as 0%, so gaps break a streak
//   - weeks: real Mon-Sun calendar weeks; months: real calendar months

export function getActiveTodos(todos) {
  return (todos || []).filter((t) => t.active);
}

// date string (YYYY-MM-DD) -> { total, done }
export function buildDayMap(todos) {
  const map = {};
  for (const t of getActiveTodos(todos)) {
    const date = t.created_at.split('T')[0];
    if (!map[date]) map[date] = { total: 0, done: 0 };
    map[date].total++;
    if (t.completed) map[date].done++;
  }
  return map;
}

export function dayPct(day) {
  if (!day || day.total === 0) return 0;
  return (day.done / day.total) * 100;
}

// True ratio across all recorded days, not an average of per-day percentages.
export function computeOverallRate(dayMap) {
  let totalCompleted = 0;
  let totalTasks = 0;
  for (const day of Object.values(dayMap)) {
    totalTasks += day.total;
    totalCompleted += day.done;
  }
  return {
    totalCompleted,
    totalTasks,
    rate: totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0,
  };
}

// Calendar-day-aware streak: walks every calendar day from the earliest recorded
// day through today, treating a day with no rows as 0%. A day qualifies if its
// completion % is >= threshold. Returns both the best-ever streak and the streak
// ending today (0 if today doesn't currently qualify).
export function computeStreaks(dayMap, threshold = 50) {
  const dates = Object.keys(dayMap).sort();
  if (dates.length === 0) return { bestStreak: 0, currentStreak: 0 };

  const start = new Date(dates[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  let bestStreak = 0;
  let running = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().split('T')[0];
    const pct = dayPct(dayMap[key]);
    if (pct >= threshold) {
      running++;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { bestStreak, currentStreak: running };
}

// "Comeback" streak: N consecutive calendar days at/above `threshold`, immediately
// following a 0% day. Calendar-gap-aware like computeStreaks.
export function computeComebackStreak(dayMap, threshold = 90) {
  const dates = Object.keys(dayMap).sort();
  if (dates.length === 0) return { bestStreak: 0, currentStreak: 0 };

  const start = new Date(dates[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  let bestStreak = 0;
  let running = 0;
  let armed = false; // true once we've seen a 0% day and are watching for the comeback
  let prevPct = null;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().split('T')[0];
    const pct = dayPct(dayMap[key]);

    if (prevPct === 0) armed = true;

    if (armed && pct >= threshold) {
      running++;
      bestStreak = Math.max(bestStreak, running);
    } else if (armed && pct < threshold) {
      running = 0;
      armed = pct === 0; // a fresh 0% day re-arms immediately
    }

    prevPct = pct;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { bestStreak, currentStreak: running };
}

// Real Mon-Sun calendar week. offset=0 is this week, -1 is last week, etc.
export function getWeekRange(offset = 0) {
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

// Real calendar month. offset=0 is this month, -1 is last month, etc.
export function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
