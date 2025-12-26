-- Fix the memberships RLS policy that has a bug in the subquery
-- The policy references membership_shares.id instead of memberships.id

DROP POLICY IF EXISTS "Users can view their membership or shared membership" ON public.memberships;

CREATE POLICY "Users can view their membership or shared membership" 
ON public.memberships 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR 
  (EXISTS (
    SELECT 1 FROM membership_shares 
    WHERE membership_shares.membership_id = memberships.id 
    AND membership_shares.shared_with_user_id = auth.uid()
  ))
);