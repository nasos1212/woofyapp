-- Allow businesses to view membership info for customers who have redeemed at their business
CREATE POLICY "Businesses can view customer memberships"
ON public.memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.businesses b
    WHERE b.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 
    FROM public.offer_redemptions r
    JOIN public.businesses b ON b.id = r.business_id
    WHERE r.membership_id = memberships.id 
      AND b.user_id = auth.uid()
  )
);