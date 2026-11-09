ALTER TABLE public.shelters ADD COLUMN animals_in_care_type text NOT NULL DEFAULT 'dogs' CHECK (animals_in_care_type IN ('dogs', 'cats', 'both'));
CREATE OR REPLACE VIEW public.shelters_public AS
SELECT id, user_id, shelter_name, location, city, address, description, mission_statement, logo_url, cover_photo_url, cover_photo_position, website, donation_link, dogs_in_care, dogs_helped_count, years_operating, facebook_url, instagram_url, tiktok_url, email, phone, contact_name, verification_status, is_hidden, verified_at, created_at, updated_at, animals_in_care_type
FROM public.shelters
WHERE verification_status = 'approved'::public.verification_status AND NOT is_hidden OR public.has_role(auth.uid(), 'admin'::public.app_role);