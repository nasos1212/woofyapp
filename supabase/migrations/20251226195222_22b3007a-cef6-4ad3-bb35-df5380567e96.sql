-- Create offer_redemptions table to track one-time offer usage
CREATE TABLE public.offer_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_by_user_id UUID NOT NULL,
  UNIQUE(membership_id, offer_id)
);

-- Enable RLS
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Members can view their own redemptions
CREATE POLICY "Members can view their own redemptions"
ON public.offer_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE memberships.id = offer_redemptions.membership_id 
    AND memberships.user_id = auth.uid()
  )
);

-- Business owners can view and insert redemptions for their business
CREATE POLICY "Business owners can view redemptions for their business"
ON public.offer_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = offer_redemptions.business_id 
    AND businesses.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can insert redemptions"
ON public.offer_redemptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = offer_redemptions.business_id 
    AND businesses.user_id = auth.uid()
  )
);