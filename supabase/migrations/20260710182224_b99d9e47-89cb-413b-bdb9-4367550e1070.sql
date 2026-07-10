CREATE POLICY "Users can view businesses where they redeemed offers"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.offer_redemptions r
    WHERE r.business_id = businesses.id
      AND r.redeemed_by_user_id = auth.uid()
  )
);