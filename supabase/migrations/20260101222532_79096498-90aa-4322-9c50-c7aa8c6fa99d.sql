-- Allow businesses to view profiles of members who have redeemed their offers
CREATE POLICY "Businesses can view profiles of members who redeemed their offers"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offer_redemptions or2
    JOIN memberships m ON m.id = or2.membership_id
    JOIN businesses b ON b.id = or2.business_id
    WHERE m.user_id = profiles.user_id
    AND b.user_id = auth.uid()
  )
);