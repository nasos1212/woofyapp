-- Add policy to allow authenticated users to view basic profile info
-- This is needed for businesses to see customer names
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);