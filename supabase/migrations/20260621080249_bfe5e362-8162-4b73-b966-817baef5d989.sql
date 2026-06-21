
-- 1) Lost pet alerts: lock base table, recreate view with masked contact info
DROP POLICY IF EXISTS "Anyone can view active and resolved alerts" ON public.lost_pet_alerts;

CREATE POLICY "Owners and admins can view alerts directly"
  ON public.lost_pet_alerts FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP VIEW IF EXISTS public.lost_pet_alerts_public;

CREATE VIEW public.lost_pet_alerts_public
WITH (security_invoker = off) AS
SELECT
  a.id,
  a.owner_user_id,
  a.pet_id,
  a.pet_name,
  a.pet_description,
  a.pet_breed,
  a.pet_photo_url,
  a.pet_type,
  a.alert_type,
  a.last_seen_location,
  a.last_seen_latitude,
  a.last_seen_longitude,
  a.last_seen_date,
  CASE WHEN public.can_view_lost_pet_contact(a.owner_user_id, a.id)
       THEN a.contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN public.can_view_lost_pet_contact(a.owner_user_id, a.id)
       THEN a.contact_email ELSE NULL END AS contact_email,
  a.reward_offered,
  a.additional_info,
  a.microchip_status,
  a.status,
  a.resolved_at,
  a.created_at,
  a.updated_at
FROM public.lost_pet_alerts a
WHERE a.status IN ('active', 'resolved');

GRANT SELECT ON public.lost_pet_alerts_public TO anon, authenticated;

-- 2) Lost pet photo storage: require user-id-scoped folder on upload
DROP POLICY IF EXISTS "Users can upload lost pet photos" ON storage.objects;

CREATE POLICY "Users can upload lost pet photos to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lost-pet-photos'
    AND (storage.foldername(name))[1] = 'lost-pets'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 3) Pet-friendly place ratings: require authentication to read
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.pet_friendly_place_ratings;

CREATE POLICY "Authenticated users can view ratings"
  ON public.pet_friendly_place_ratings FOR SELECT
  TO authenticated
  USING (true);
