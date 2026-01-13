-- Drop the unique constraint that prevents multiple redemptions per member per offer
-- This is needed to support the new redemption_frequency options (daily, weekly, monthly, unlimited)
ALTER TABLE public.offer_redemptions DROP CONSTRAINT IF EXISTS offer_redemptions_membership_id_offer_id_key;