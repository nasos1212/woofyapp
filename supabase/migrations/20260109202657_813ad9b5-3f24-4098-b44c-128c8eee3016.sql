-- Add max_redemptions column to offers table
ALTER TABLE public.offers 
ADD COLUMN max_redemptions integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.offers.max_redemptions IS 'Maximum number of times this offer can be redeemed. NULL means unlimited.';