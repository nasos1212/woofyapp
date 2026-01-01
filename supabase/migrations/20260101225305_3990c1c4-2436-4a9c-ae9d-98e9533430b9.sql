-- Allow businesses to view pets belonging to members who redeemed their offers
CREATE POLICY "Businesses can view pets of members who redeemed their offers" 
ON public.pets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM offer_redemptions r
    JOIN businesses b ON b.id = r.business_id
    WHERE r.membership_id = pets.membership_id 
    AND b.user_id = auth.uid()
  )
);