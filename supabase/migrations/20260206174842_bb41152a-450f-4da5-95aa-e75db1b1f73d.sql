-- Allow businesses to view profiles of customers who have redeemed offers at their business
CREATE POLICY "Businesses can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  -- User is a business owner
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.user_id = auth.uid()
  )
  AND
  -- The profile belongs to a customer who has redeemed an offer at this business
  EXISTS (
    SELECT 1 FROM public.offer_redemptions r
    JOIN public.memberships m ON m.id = r.membership_id
    JOIN public.businesses b ON b.id = r.business_id
    WHERE m.user_id = profiles.user_id
    AND b.user_id = auth.uid()
  )
);