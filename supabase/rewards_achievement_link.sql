-- Link rewards to a specific achievement, so completing that achievement
-- (reaching its target value) can automatically unlock the reward.
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_rewards_achievement_id ON rewards(achievement_id);
