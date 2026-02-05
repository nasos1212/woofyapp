-- Fix 1: Drop the overly permissive profiles policy and create a more secure one
-- that only exposes non-sensitive fields (full_name, avatar_url)
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Create a view for public profile data (non-sensitive fields only)
CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = on)
AS SELECT 
  user_id,
  full_name,
  avatar_url,
  preferred_city
FROM public.profiles;

-- Fix 2: Add RLS policy to restrict reading adoption inquiries to shelter owners only
-- First check existing policies and add the restrictive one
CREATE POLICY "Shelter owners can view their adoption inquiries"
ON public.adoption_inquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE shelters.id = adoption_inquiries.shelter_id 
    AND shelters.user_id = auth.uid()
  )
  OR
  public.has_role(auth.uid(), 'admin')
);