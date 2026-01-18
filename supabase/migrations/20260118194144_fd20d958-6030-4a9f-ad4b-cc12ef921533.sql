-- Allow businesses to send notifications to customers who redeemed their offers
CREATE POLICY "Businesses can send notifications to their customers"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM businesses b
    JOIN offer_redemptions orr ON orr.business_id = b.id
    JOIN pets p ON p.membership_id = orr.membership_id
    WHERE b.user_id = auth.uid()
    AND p.owner_user_id = notifications.user_id
  )
);