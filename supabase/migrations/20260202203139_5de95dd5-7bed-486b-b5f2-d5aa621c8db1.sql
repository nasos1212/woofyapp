-- Fix Security Issues: Restrict business access to customer data

-- =====================================================
-- FIX 1: Create a view for businesses to see limited profile info
-- Instead of full profiles with emails/phones, businesses should only see
-- first name and minimal info needed for birthday greetings
-- =====================================================

-- First, create a public view that exposes only safe profile data
CREATE OR REPLACE VIEW public.profiles_limited
WITH (security_invoker = on) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  preferred_city
  -- Excludes: email, phone, login_count, email_verified (sensitive fields)
FROM public.profiles;

-- Drop the overly permissive business profile access policy
DROP POLICY IF EXISTS "Businesses can view customer profiles" ON public.profiles;

-- Create a new restricted policy: Businesses can ONLY access customer profiles
-- through the limited view, not direct table access
-- The base table should only allow user self-access and admin access
-- Since we already have "Users can view their own profile" and "Admins can view all profiles",
-- removing the business policy is sufficient

-- =====================================================
-- FIX 2: Restrict business access to pets table
-- Businesses should only see the SPECIFIC pet used in each redemption,
-- not ALL pets on the membership
-- =====================================================

-- Drop the overly permissive business pets access policy
DROP POLICY IF EXISTS "Businesses can view pets of members who redeemed their offers" ON public.pets;

-- Create a more restrictive policy: Businesses can ONLY view the specific pet
-- that was involved in a redemption at their business
CREATE POLICY "Businesses can view specific redeemed pets only"
  ON public.pets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM offer_redemptions r
      JOIN businesses b ON b.id = r.business_id
      WHERE r.pet_id = pets.id  -- Only the SPECIFIC pet, not all pets on membership
        AND b.user_id = auth.uid()
    )
  );

-- Grant SELECT on the limited profiles view 
GRANT SELECT ON public.profiles_limited TO authenticated;