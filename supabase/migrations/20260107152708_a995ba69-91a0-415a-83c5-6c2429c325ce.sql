-- Fix Security Definer View warnings by using security_invoker
DROP VIEW IF EXISTS public.lost_pet_alerts_public;
CREATE VIEW public.lost_pet_alerts_public
WITH (security_invoker = on)
AS
SELECT 
  id,
  pet_id,
  owner_user_id,
  pet_name,
  pet_description,
  pet_breed,
  pet_photo_url,
  last_seen_location,
  last_seen_date,
  last_seen_latitude,
  last_seen_longitude,
  status,
  additional_info,
  reward_offered,
  created_at,
  updated_at,
  resolved_at,
  -- Mask contact info unless user is eligible
  CASE WHEN can_view_lost_pet_contact(owner_user_id, id) THEN contact_email ELSE NULL END as contact_email,
  CASE WHEN can_view_lost_pet_contact(owner_user_id, id) THEN contact_phone ELSE NULL END as contact_phone
FROM lost_pet_alerts;

-- Grant access to the view
GRANT SELECT ON public.lost_pet_alerts_public TO authenticated, anon;

-- Fix businesses_public view
DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
WITH (security_invoker = on)
AS
SELECT 
  id,
  business_name,
  description,
  category,
  address,
  city,
  website,
  google_maps_url,
  logo_url,
  verification_status,
  verified_at,
  created_at,
  updated_at
FROM businesses
WHERE verification_status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO authenticated, anon;