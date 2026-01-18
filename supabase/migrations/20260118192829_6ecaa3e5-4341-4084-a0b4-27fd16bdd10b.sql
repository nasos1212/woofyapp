-- Drop the existing policy with truncated name
DROP POLICY IF EXISTS "Businesses can view profiles of members who redeemed their offe" ON public.profiles;

-- Create a corrected policy for businesses to view customer profiles
CREATE POLICY "Businesses can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM offer_redemptions or2
    JOIN memberships m ON m.id = or2.membership_id
    JOIN businesses b ON b.id = or2.business_id
    WHERE m.user_id = profiles.user_id
    AND b.user_id = auth.uid()
  )
);