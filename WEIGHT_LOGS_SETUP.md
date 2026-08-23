# Weight Logs Table Setup

## Run this SQL in your Supabase SQL Editor:

```sql
-- Weight logs for WorkoutDiet tracker
CREATE TABLE IF NOT EXISTS weight_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE NOT NULL,
  weight     NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on weight_logs" ON weight_logs FOR ALL USING (true);
```

## Steps:
1. Go to https://supabase.com/dashboard/project/quufeiwzsgiuwkeyjjns/sql/new
2. Paste the SQL above
3. Click "Run"

That's it! The weight tracker will now work.
