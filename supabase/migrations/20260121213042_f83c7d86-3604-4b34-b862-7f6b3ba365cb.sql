-- Add redeemed_at column to track birthday offer redemptions
ALTER TABLE public.sent_birthday_offers 
ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add redeemed_by_business_id to track which business redeemed it
ALTER TABLE public.sent_birthday_offers 
ADD COLUMN redeemed_by_business_id UUID REFERENCES public.businesses(id) DEFAULT NULL;

-- Create an index for faster lookups of unredeemed offers
CREATE INDEX idx_sent_birthday_offers_unredeemed 
ON public.sent_birthday_offers (owner_user_id, redeemed_at) 
WHERE redeemed_at IS NULL;