-- Create table to track sent birthday offers
CREATE TABLE public.sent_birthday_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  pet_name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  owner_name TEXT,
  discount_value INTEGER NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sent_birthday_offers ENABLE ROW LEVEL SECURITY;

-- Businesses can view their own sent offers
CREATE POLICY "Businesses can view their sent birthday offers"
ON public.sent_birthday_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = sent_birthday_offers.business_id
    AND b.user_id = auth.uid()
  )
);

-- Businesses can insert their own sent offers
CREATE POLICY "Businesses can insert their sent birthday offers"
ON public.sent_birthday_offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = sent_birthday_offers.business_id
    AND b.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_sent_birthday_offers_business_id ON public.sent_birthday_offers(business_id);
CREATE INDEX idx_sent_birthday_offers_sent_at ON public.sent_birthday_offers(sent_at DESC);