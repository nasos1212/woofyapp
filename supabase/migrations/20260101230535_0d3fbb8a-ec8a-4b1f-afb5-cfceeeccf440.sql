-- Add columns to store member and pet info at redemption time
ALTER TABLE public.offer_redemptions 
ADD COLUMN IF NOT EXISTS member_name text,
ADD COLUMN IF NOT EXISTS pet_names text,
ADD COLUMN IF NOT EXISTS member_number text;