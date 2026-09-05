-- ============================================================================
-- Clear ALL data from every app table (schema/tables stay intact).
-- ⚠️ DESTRUCTIVE & IRREVERSIBLE — this deletes every row, permanently.
-- Run only in the SQL Editor when you are certain you want a clean slate.
-- ============================================================================

TRUNCATE TABLE
  "ToDo",
  achievements,
  achievement_logs,
  mood_tracker,
  habits,
  habit_logs,
  journal_entries,
  skills,
  skill_ratings,
  books_tracker,
  mirror_talk,
  fear_crusher,
  comfort_zone,
  shopping_plans,
  money_transactions,
  budget_plan,
  categories,
  rewards,
  plans,
  plan_images,
  friends,
  gym_logs,
  weight_logs,
  eye_health_logs,
  user_profile,
  job_applications,
  daily_todo_summary,
  daily_performance,
  daily_points,
  weekly_points,
  monthly_points,
  quotes,
  scripts,
  pomodoro_sessions,
  gallery,
  memories,
  push_subscriptions,
  patience_logs
RESTART IDENTITY CASCADE;
