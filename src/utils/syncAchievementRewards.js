// Unlocks every locked reward linked to an achievement that has reached its target.
// Returns the rewards that were newly unlocked.
export async function syncAchievementRewards(supabase) {
  const { data: locked, error } = await supabase
    .from("rewards")
    .select("id, reward_title, achievement_id")
    .eq("unlocked", false)
    .not("achievement_id", "is", null);

  if (error || !locked?.length) return [];

  const ids = [...new Set(locked.map((r) => r.achievement_id))];
  const [{ data: achievements }, { data: logs }] = await Promise.all([
    supabase.from("achievements").select("id, target_value").in("id", ids),
    supabase
      .from("achievement_logs")
      .select("achievement_id")
      .eq("done", true)
      .in("achievement_id", ids),
  ]);

  const doneCounts = (logs || []).reduce((acc, l) => {
    acc[l.achievement_id] = (acc[l.achievement_id] || 0) + 1;
    return acc;
  }, {});
  const completed = new Set(
    (achievements || [])
      .filter((a) => (doneCounts[a.id] || 0) >= a.target_value)
      .map((a) => a.id)
  );

  const toUnlock = locked.filter((r) => completed.has(r.achievement_id));
  if (!toUnlock.length) return [];

  const { error: updateError } = await supabase
    .from("rewards")
    .update({ unlocked: true, unlocked_on: new Date().toISOString() })
    .in("id", toUnlock.map((r) => r.id));

  if (updateError) {
    console.error("Error unlocking rewards:", updateError);
    return [];
  }
  return toUnlock;
}
