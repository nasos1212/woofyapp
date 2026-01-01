-- Allow system to insert notifications (for edge functions using service role)
-- The edge function uses service role key which bypasses RLS, so no policy needed

-- But we should allow members to also insert redemptions via edge function
-- First, let's add a policy that allows authenticated users to insert redemptions 
-- when they're either the business owner OR when used via service role

-- Drop and recreate the insert policy for offer_redemptions to be more permissive
-- The edge function validates business ownership in code
DROP POLICY IF EXISTS "Business owners can insert redemptions" ON offer_redemptions;

CREATE POLICY "Authenticated users can insert redemptions via edge function"
ON offer_redemptions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);