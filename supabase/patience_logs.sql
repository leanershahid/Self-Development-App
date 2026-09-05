-- Patience Marker: logs each moment you consciously stayed patient
CREATE TABLE IF NOT EXISTS patience_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger TEXT,          -- e.g. Traffic, Work, Family, Social, Waiting, Other
  intensity INTEGER,     -- 1-5, how hard it was to stay patient
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patience_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage patience logs" ON patience_logs
  FOR ALL USING (true) WITH CHECK (true);
