-- Link rewards to achievements (Core Directives): completing the achievement unlocks the reward
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL;
