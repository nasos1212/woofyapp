-- Add enhanced redemption fields to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS redemption_scope TEXT DEFAULT 'per_member' CHECK (redemption_scope IN ('per_member', 'per_pet', 'unlimited')),
ADD COLUMN IF NOT EXISTS redemption_frequency TEXT DEFAULT 'one_time' CHECK (redemption_frequency IN ('one_time', 'daily', 'weekly', 'monthly', 'unlimited')),
ADD COLUMN IF NOT EXISTS valid_days INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_hours_start TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_hours_end TIME DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.offers.redemption_scope IS 'Who can redeem: per_member (once per membership), per_pet (each pet can redeem), unlimited (no tracking)';
COMMENT ON COLUMN public.offers.redemption_frequency IS 'How often: one_time, daily, weekly, monthly, unlimited';
COMMENT ON COLUMN public.offers.valid_days IS 'Array of valid days (0=Sunday, 1=Monday, etc). NULL means all days';
COMMENT ON COLUMN public.offers.valid_hours_start IS 'Start time for time-restricted offers';
COMMENT ON COLUMN public.offers.valid_hours_end IS 'End time for time-restricted offers';