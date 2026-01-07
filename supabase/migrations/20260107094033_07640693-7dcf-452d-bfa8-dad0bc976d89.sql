-- Fix 1: Create a function to check if user can see lost pet contact info
-- User can see contact if: they are the owner, or they have notification preferences enabled with cities
CREATE OR REPLACE FUNCTION public.can_view_lost_pet_contact(alert_owner_id uuid, alert_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Owner can always see their own contact info
    auth.uid() = alert_owner_id
    OR
    -- Users with enabled notifications and selected cities can see contact info
    EXISTS (
      SELECT 1 FROM lost_pet_notification_preferences
      WHERE user_id = auth.uid()
        AND enabled = true
        AND array_length(cities, 1) > 0
    )
    OR
    -- Users who reported a sighting for this alert can see contact info
    EXISTS (
      SELECT 1 FROM lost_pet_sightings
      WHERE alert_id = $2
        AND reporter_user_id = auth.uid()
    )
$$;

-- Fix 2: Create a view for lost pet alerts that masks contact info
CREATE OR REPLACE VIEW public.lost_pet_alerts_public AS
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

-- Fix 3: Update businesses_public view to ensure no sensitive data
DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public AS
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
  -- Explicitly excluding: email, phone, user_id
FROM businesses
WHERE verification_status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO authenticated, anon;