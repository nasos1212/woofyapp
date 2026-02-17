-- Allow admins to insert pet friendly places (even without added_by_user_id matching)
CREATE POLICY "Admins can insert pet friendly places"
ON public.pet_friendly_places
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
