
DROP VIEW IF EXISTS public.shelters_public;

CREATE VIEW public.shelters_public
WITH (security_invoker=off) AS
SELECT
  s.id, s.user_id, s.shelter_name, s.location, s.city, s.address,
  s.description, s.mission_statement,
  s.logo_url, s.cover_photo_url, s.cover_photo_position,
  s.website, s.donation_link, s.dogs_in_care, s.dogs_helped_count,
  s.years_operating,
  s.facebook_url, s.instagram_url, s.tiktok_url,
  s.verification_status, s.is_hidden, s.verified_at,
  s.created_at, s.updated_at
FROM public.shelters s
WHERE s.verification_status = 'approved'::verification_status
  AND s.is_hidden = false;

GRANT SELECT ON public.shelters_public TO anon, authenticated;
