-- Fix security definer view by using security invoker instead
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
FROM public.businesses
WHERE verification_status = 'approved';