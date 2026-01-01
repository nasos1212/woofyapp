-- Fix the Security Definer View warning by recreating the view without SECURITY DEFINER
-- The underlying businesses table already has RLS, so this is safe
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  business_name,
  category,
  description,
  address,
  city,
  website,
  logo_url,
  google_maps_url,
  verification_status,
  verified_at,
  created_at,
  updated_at
FROM businesses
WHERE verification_status = 'approved';

-- Grant access to the view for all users
GRANT SELECT ON public.businesses_public TO anon, authenticated;