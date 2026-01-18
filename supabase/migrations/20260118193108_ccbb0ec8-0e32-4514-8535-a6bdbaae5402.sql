-- Drop and recreate the policy with a simpler approach using pets table
DROP POLICY IF EXISTS "Businesses can view customer profiles" ON public.profiles;

-- Create a policy that allows businesses to see profiles of pet owners who redeemed offers
CREATE POLICY "Businesses can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM pets p
    JOIN offer_redemptions or2 ON or2.membership_id = p.membership_id
    JOIN businesses b ON b.id = or2.business_id
    WHERE p.owner_user_id = profiles.user_id
    AND b.user_id = auth.uid()
  )
);