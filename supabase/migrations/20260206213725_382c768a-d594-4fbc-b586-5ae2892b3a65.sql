-- Add policy to allow reading basic profile info through the public view
-- This enables community features like seeing question authors
CREATE POLICY "Anyone can view basic profile info for community"
  ON public.profiles FOR SELECT
  USING (
    -- Allow reading profiles of users who have posted in community (non-anonymous)
    EXISTS (
      SELECT 1 FROM community_questions cq 
      WHERE cq.user_id = profiles.user_id 
      AND cq.is_anonymous = false
    )
    OR
    EXISTS (
      SELECT 1 FROM community_answers ca 
      WHERE ca.user_id = profiles.user_id
    )
  );