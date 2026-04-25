-- Recreate businesses_public view to exclude hidden businesses
CREATE OR REPLACE VIEW public.businesses_public
WITH (security_invoker=on) AS
SELECT
  id,
  business_name,
  description,
  category,
  categories,
  address,
  city,
  website,
  google_maps_url,
  logo_url,
  instagram_url,
  facebook_url,
  tiktok_url,
  verification_status,
  verified_at,
  created_at,
  updated_at
FROM public.businesses
WHERE verification_status = 'approved'::verification_status
  AND is_hidden = false;