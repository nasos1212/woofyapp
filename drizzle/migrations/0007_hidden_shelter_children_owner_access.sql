DROP POLICY IF EXISTS "Hidden shelter pet photos are admin only" ON public.shelter_adoptable_pet_photos;
CREATE POLICY "Hidden shelter pet photos are admin only" ON public.shelter_adoptable_pet_photos AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.shelter_adoptable_pets p JOIN public.shelters s ON s.id = p.shelter_id WHERE p.id = shelter_adoptable_pet_photos.pet_id AND ((NOT s.is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR s.user_id = auth.uid())));
DROP POLICY IF EXISTS "Hidden shelter pets are admin only" ON public.shelter_adoptable_pets;
CREATE POLICY "Hidden shelter pets are admin only" ON public.shelter_adoptable_pets AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.shelters s WHERE s.id = shelter_adoptable_pets.shelter_id AND ((NOT s.is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR s.user_id = auth.uid())));
DROP POLICY IF EXISTS "Hidden shelter photos are admin only" ON public.shelter_photos;
CREATE POLICY "Hidden shelter photos are admin only" ON public.shelter_photos AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.shelters s WHERE s.id = shelter_photos.shelter_id AND ((NOT s.is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR s.user_id = auth.uid())));