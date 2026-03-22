CREATE POLICY "Admins can view all pets"
ON public.pets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));