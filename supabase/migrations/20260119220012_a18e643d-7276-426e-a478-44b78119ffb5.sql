-- Recreate the view without SECURITY DEFINER to use the invoker's permissions
DROP VIEW IF EXISTS public.lost_pet_alerts_public;

CREATE VIEW public.lost_pet_alerts_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  owner_user_id,
  pet_id,
  pet_name,
  pet_description,
  pet_breed,
  pet_photo_url,
  pet_type,
  alert_type,
  last_seen_location,
  last_seen_latitude,
  last_seen_longitude,
  last_seen_date,
  CASE 
    WHEN can_view_lost_pet_contact(owner_user_id, id) THEN contact_phone 
    ELSE NULL 
  END AS contact_phone,
  CASE 
    WHEN can_view_lost_pet_contact(owner_user_id, id) THEN contact_email 
    ELSE NULL 
  END AS contact_email,
  reward_offered,
  additional_info,
  status,
  resolved_at,
  created_at,
  updated_at
FROM public.lost_pet_alerts;

-- Grant access to the view
GRANT SELECT ON public.lost_pet_alerts_public TO anon, authenticated;