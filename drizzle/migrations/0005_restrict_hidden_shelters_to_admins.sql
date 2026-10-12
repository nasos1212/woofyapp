CREATE POLICY "Hidden shelters are admin only" ON public.shelters AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (NOT is_hidden OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hidden shelters cannot be edited by non admins" ON public.shelters AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT is_hidden OR public.has_role(auth.uid(), 'admin')) WITH CHECK (NOT is_hidden OR public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.protect_shelter_visibility() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF (TG_OP = 'INSERT' AND NEW.is_hidden) OR (TG_OP = 'UPDATE' AND NEW.is_hidden IS DISTINCT FROM OLD.is_hidden) THEN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') AND NOT public.has_role(auth.uid(), 'admin') THEN
   RAISE EXCEPTION 'Only admins can change shelter visibility' USING ERRCODE = '42501';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_shelter_visibility BEFORE INSERT OR UPDATE OF is_hidden ON public.shelters FOR EACH ROW EXECUTE FUNCTION public.protect_shelter_visibility();
CREATE OR REPLACE VIEW public.shelters_public AS SELECT id, user_id, shelter_name, location, city, address, description, mission_statement, logo_url, cover_photo_url, cover_photo_position, website, donation_link, dogs_in_care, dogs_helped_count, years_operating, facebook_url, instagram_url, tiktok_url, email, phone, contact_name, verification_status, is_hidden, verified_at, created_at, updated_at FROM public.shelters WHERE (verification_status = 'approved' AND NOT is_hidden) OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.shelters_public TO anon, authenticated, service_role;
CREATE OR REPLACE VIEW public.shelters_directory AS SELECT id, shelter_name, location, city, address, description, mission_statement, logo_url, cover_photo_url, cover_photo_position, website, donation_link, dogs_in_care, dogs_helped_count, years_operating, facebook_url, instagram_url, tiktok_url, verification_status, is_hidden, verified_at, created_at, updated_at FROM public.shelters WHERE (verification_status = 'approved' AND NOT is_hidden) OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.shelters_directory TO anon, authenticated, service_role;
CREATE POLICY "Hidden shelter pets are admin only" ON public.shelter_adoptable_pets AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.shelters s WHERE s.id = shelter_id AND (NOT s.is_hidden OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins can view all shelter pets" ON public.shelter_adoptable_pets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hidden shelter photos are admin only" ON public.shelter_photos AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.shelters s WHERE s.id = shelter_id AND (NOT s.is_hidden OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Hidden shelter pet photos are admin only" ON public.shelter_adoptable_pet_photos AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.shelter_adoptable_pets p JOIN public.shelters s ON s.id = p.shelter_id WHERE p.id = pet_id AND (NOT s.is_hidden OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins can view all shelter pet photos" ON public.shelter_adoptable_pet_photos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
