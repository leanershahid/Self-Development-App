-- Per-day Did/Didn't log for Core Directives (achievements)
CREATE TABLE IF NOT EXISTS achievement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  done BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (achievement_id, log_date)
);

ALTER TABLE achievement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage achievement logs" ON achievement_logs
  FOR ALL USING (true);
