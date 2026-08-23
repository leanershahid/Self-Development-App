-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/delete subscriptions
CREATE POLICY "Anyone can manage subscriptions" ON push_subscriptions
  FOR ALL USING (true);

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Todo reminder every 30 minutes (9 AM to 9 PM)
SELECT cron.schedule(
  'todo-reminder-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://quufeiwzsgiuwkeyjjns.supabase.co/functions/v1/todo-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

-- Friends overdue reminder every day at 10 AM
SELECT cron.schedule(
  'send-push-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://quufeiwzsgiuwkeyjjns.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

-- Morning notification at 8 AM
SELECT cron.schedule(
  'morning-reminder',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://quufeiwzsgiuwkeyjjns.supabase.co/functions/v1/todo-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{"type":"morning"}'::jsonb
  );
  $$
);

-- Night notification at 9 PM
SELECT cron.schedule(
  'night-reminder',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://quufeiwzsgiuwkeyjjns.supabase.co/functions/v1/todo-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{"type":"night"}'::jsonb
  );
  $$
);