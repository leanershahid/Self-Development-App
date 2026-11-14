-- Lets an achievement mark specific weekdays (0=Sun..6=Sat, matching JS Date.getDay())
-- as excluded from daily logging — those days render locked in the calendar.
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS excluded_days SMALLINT[] NOT NULL DEFAULT '{}';
