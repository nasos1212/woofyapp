-- Add alert_type column to lost_pet_alerts to distinguish between lost and found pets
ALTER TABLE public.lost_pet_alerts 
ADD COLUMN IF NOT EXISTS alert_type text NOT NULL DEFAULT 'lost' 
CHECK (alert_type IN ('lost', 'found'));

-- Add pet_type column to specify if it's a dog, cat, etc.
ALTER TABLE public.lost_pet_alerts 
ADD COLUMN IF NOT EXISTS pet_type text DEFAULT 'dog';

-- Update the public view to include the new columns
DROP VIEW IF EXISTS public.lost_pet_alerts_public;

CREATE VIEW public.lost_pet_alerts_public AS
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