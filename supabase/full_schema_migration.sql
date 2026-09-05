-- ============================================================================
-- Full schema migration for Self-Development-App
-- Reconstructed from live codebase usage (no direct DB access to the old
-- project was available — every table/column below was inferred by scanning
-- every .from()/.select()/.insert()/.update() call across the app).
--
-- Run this ONCE against the NEW Supabase project (qwjujuvtfqahapohhfzs)
-- in the SQL Editor. Safe to re-run (IF NOT EXISTS everywhere).
--
-- RLS: this app has no auth system (single-user, PIN-locked client-side),
-- so every table gets a permissive "anyone can do anything" policy,
-- matching the existing convention in supabase/setup.sql.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- ToDo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ToDo" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  priority TEXT DEFAULT 'medium',
  due_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- achievements + achievement_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  done BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (achievement_id, log_date)
);

-- ---------------------------------------------------------------------------
-- mood_tracker (one row per day, upsert-by-date pattern)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mood INTEGER,
  note TEXT,
  productivity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- habits + habit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (habit_id, date)
);

-- ---------------------------------------------------------------------------
-- journal_entries (upsert-by-date)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  word_count INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- skills + skill_ratings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  goal_rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL,
  note TEXT,
  rated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- books_tracker
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  status TEXT DEFAULT 'reading', -- reading | learning | completed | paused | wishlist
  rating NUMERIC,
  notes TEXT,
  type TEXT DEFAULT 'book', -- book | course | podcast | video
  duration TEXT,
  start_date DATE,
  end_date DATE,
  stages JSONB DEFAULT '[]'::jsonb, -- [{label, done}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- mirror_talk, fear_crusher, comfort_zone (mindset tools)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mirror_talk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fear_crusher (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fear TEXT NOT NULL,
  challenge TEXT,
  conquered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comfort_zone (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  difficulty NUMERIC,
  reflection TEXT,
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Finance Vault: money_transactions, budget_plan, categories, shopping_plans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC,
  image_url TEXT,
  priority TEXT DEFAULT 'medium', -- high | medium | low
  quantity NUMERIC,
  unit TEXT DEFAULT 'nos',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS money_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- income | expense
  category TEXT,
  date DATE NOT NULL,
  shopping_plan_id UUID REFERENCES shopping_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_plan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  income NUMERIC NOT NULL,
  ledgers JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, percent, amount}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- rewards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_type TEXT NOT NULL, -- weekly | milestone etc.
  reward_title TEXT NOT NULL,
  reward_description TEXT,
  image_url TEXT,
  week_count INTEGER,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- plans + plan_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority INTEGER DEFAULT 3, -- 1 high, 2 medium, 3 low
  status TEXT DEFAULT 'active', -- active | completed | cancelled
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- friends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  priority_level INTEGER DEFAULT 3,
  last_contacted DATE,
  meet_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Gym / Workout / Health
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gym_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise TEXT NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eye_health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  habits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Job Finder: user_profile + job_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  location TEXT,
  resume_text TEXT,
  resume_url TEXT,
  base_cover_letter TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary TEXT,
  job_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'saved', -- saved | applied | interview | offer | rejected
  applied_at DATE,
  cover_letter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Performance Dashboard: daily/weekly/monthly rollups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_todo_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  total_todos INTEGER DEFAULT 0,
  completed_todos INTEGER DEFAULT 0,
  failed_todos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  completion_percentage NUMERIC,
  performance_status TEXT, -- excellent | good | average | poor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  points NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  week_end DATE,
  total_points NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_points NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (month, year)
);

-- ---------------------------------------------------------------------------
-- Quotes (Inspirations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author TEXT,
  category TEXT DEFAULT 'motivation',
  mood TEXT DEFAULT 'calm',
  language TEXT DEFAULT 'en',
  source TEXT DEFAULT 'personal',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Script Writer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  category TEXT DEFAULT 'YouTube',
  tone TEXT DEFAULT 'Motivational',
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Pomodoro
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task TEXT,
  mode TEXT DEFAULT 'focus',
  completed_at TIMESTAMPTZ,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Gallery / Memories (dynamic-table pattern in GalleryPage.jsx)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  type TEXT DEFAULT 'image', -- image | video
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  type TEXT DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Push subscriptions (already in setup.sql, included here idempotently)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Patience Marker
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patience_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger TEXT,
  intensity INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security — permissive "anyone can manage" policy on every table
-- (matches this app's existing single-user, no-auth convention)
-- ============================================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'ToDo','achievements','achievement_logs','mood_tracker','habits','habit_logs',
      'journal_entries','skills','skill_ratings','books_tracker','mirror_talk',
      'fear_crusher','comfort_zone','shopping_plans','money_transactions',
      'budget_plan','categories','rewards','plans','plan_images','friends',
      'gym_logs','weight_logs','eye_health_logs','user_profile','job_applications',
      'daily_todo_summary','daily_performance','daily_points','weekly_points',
      'monthly_points','quotes','scripts','pomodoro_sessions','gallery','memories',
      'push_subscriptions','patience_logs'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'DROP POLICY IF EXISTS "Anyone can manage %s" ON %I;', t, t
    );
    EXECUTE format(
      'CREATE POLICY "Anyone can manage %s" ON %I FOR ALL USING (true) WITH CHECK (true);',
      t, t
    );
  END LOOP;
END $$;
