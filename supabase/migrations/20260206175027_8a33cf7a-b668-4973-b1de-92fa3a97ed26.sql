-- Drop the existing policy that incorrectly uses membership owner instead of pet owner
DROP POLICY IF EXISTS "Businesses can view customer profiles" ON public.profiles;

-- Create corrected policy that matches pet owners (who may be shared members)
CREATE POLICY "Businesses can view customer profiles"
ON public.profiles FOR SELECT USING (
  -- User is a business owner
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.user_id = auth.uid())
  AND
  -- The profile belongs to someone who owns a pet linked to a membership 
  -- that has been used to redeem at this business
  EXISTS (
    SELECT 1 
    FROM public.pets p
    JOIN public.offer_redemptions r ON r.membership_id = p.membership_id
    JOIN public.businesses b ON b.id = r.business_id
    WHERE p.owner_user_id = profiles.user_id 
      AND b.user_id = auth.uid()
  )
);