
DROP VIEW IF EXISTS public.shelters_public;
CREATE VIEW public.shelters_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, shelter_name, location, city, address, description, mission_statement,
  logo_url, cover_photo_url, cover_photo_position, website, donation_link,
  dogs_in_care, dogs_helped_count, years_operating,
  facebook_url, instagram_url, tiktok_url,
  email, phone, contact_name,
  verification_status, is_hidden, verified_at, created_at, updated_at
FROM public.shelters
WHERE verification_status = 'approved'::verification_status AND is_hidden = false;

REVOKE ALL ON public.shelters_public FROM anon, authenticated, service_role;
GRANT SELECT ON public.shelters_public TO authenticated;
GRANT ALL ON public.shelters_public TO service_role;

DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
WITH (security_invoker = on) AS
SELECT
  id, business_name, description, category, categories, address, city,
  website, google_maps_url, logo_url,
  instagram_url, facebook_url, tiktok_url,
  email, phone,
  verification_status, verified_at, created_at, updated_at
FROM public.businesses
WHERE verification_status = 'approved'::verification_status AND is_hidden = false;

REVOKE ALL ON public.businesses_public FROM anon, authenticated, service_role;
GRANT SELECT ON public.businesses_public TO authenticated;
GRANT ALL ON public.businesses_public TO service_role;
