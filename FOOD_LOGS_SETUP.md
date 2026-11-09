# Food Logs Table Setup

## Run this SQL in your Supabase SQL Editor:

```sql
-- Food logs for the WorkoutDiet food logger
CREATE TABLE IF NOT EXISTS food_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE NOT NULL,
  meal_type  TEXT NOT NULL,
  food_name  TEXT NOT NULL,
  kcal       NUMERIC(6,1) NOT NULL DEFAULT 0,
  protein    NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs      NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat        NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS food_logs_date_idx ON food_logs (date);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on food_logs" ON food_logs FOR ALL USING (true);
```

## Steps:
1. Go to https://supabase.com/dashboard/project/qwjujuvtfqahapohhfzs/sql/new
2. Paste the SQL above
3. Click "Run"

That's it! The food logger in the Diet & Workout page will now work.
