-- FIX 1: Remove overly permissive profiles SELECT policy
-- Drop the policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- FIX 2: Fix adoption_inquiries INSERT policy to require authentication
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit adoption inquiries" ON public.adoption_inquiries;

-- Create a more secure INSERT policy that requires authentication
CREATE POLICY "Authenticated users can submit adoption inquiries"
ON public.adoption_inquiries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: Shelter owners can still view their inquiries via existing policy
-- Note: Users can still only view/update their own profiles via existing policies
-- Note: Admins can still view all profiles via existing admin policy