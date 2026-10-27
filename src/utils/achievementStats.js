import { supabase } from '../supabase';

// Same "actual progress" definition AchievementsPage already uses: for each
// achievement, count achievement_logs rows marked done (capped at target_value),
// turn that into a %, then roll all achievements up into one summary so other
// analytics pages (Life Success, Weekly Report, Performance) can show
// "how am I doing on my longer-term achievements" next to their ToDo-derived stats.
export async function fetchAchievementProgress() {
  const [{ data: achievements }, { data: logs }] = await Promise.all([
    supabase.from('achievements').select('id, title, target_value'),
    supabase.from('achievement_logs').select('achievement_id, done').eq('done', true),
  ]);

  const list = achievements || [];
  if (list.length === 0) {
    return { total: 0, completed: 0, avgPercent: 0, items: [] };
  }

  const doneCounts = {};
  (logs || []).forEach((l) => {
    doneCounts[l.achievement_id] = (doneCounts[l.achievement_id] || 0) + 1;
  });

  let completed = 0;
  let percentSum = 0;
  const items = list.map((a) => {
    const doneCount = doneCounts[a.id] || 0;
    const actualCurrentValue = Math.min(a.target_value, doneCount);
    const percentage = a.target_value > 0 ? (actualCurrentValue / a.target_value) * 100 : 0;
    percentSum += percentage;
    if (percentage >= 100) completed++;
    return { id: a.id, title: a.title, percent: Math.round(percentage) };
  });

  return {
    total: list.length,
    completed,
    avgPercent: Math.round(percentSum / list.length),
    items,
  };
}
