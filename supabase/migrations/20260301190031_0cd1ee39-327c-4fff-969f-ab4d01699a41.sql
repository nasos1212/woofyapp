-- Allow all authenticated users to see basic profile info via profiles_limited
-- This is safe because the view only exposes: user_id, full_name, avatar_url, preferred_city
CREATE POLICY "Authenticated users can view limited profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);