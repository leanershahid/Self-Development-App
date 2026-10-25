-- Quick Capture: a single frictionless inbox for jotting down a thought, idea,
-- or reminder from anywhere in the app, to be triaged (turned into a real task,
-- or archived) later instead of forcing a decision about where it belongs
-- at the moment of capture.
CREATE TABLE IF NOT EXISTS quick_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inbox', -- inbox | task | archived
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quick_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage quick captures" ON quick_captures
  FOR ALL USING (true) WITH CHECK (true);
