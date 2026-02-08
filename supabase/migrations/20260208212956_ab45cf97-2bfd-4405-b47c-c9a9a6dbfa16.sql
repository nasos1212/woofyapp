-- Add expires_at column to sent_birthday_offers
-- Birthday offers expire 30 days after being sent
ALTER TABLE public.sent_birthday_offers 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Set default expiration for new offers (30 days from sent_at)
-- For existing offers, set expiration based on sent_at
UPDATE public.sent_birthday_offers 
SET expires_at = sent_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL with a default
ALTER TABLE public.sent_birthday_offers 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '30 days');

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_sent_birthday_offers_expires_at 
ON public.sent_birthday_offers(expires_at) 
WHERE redeemed_at IS NULL;