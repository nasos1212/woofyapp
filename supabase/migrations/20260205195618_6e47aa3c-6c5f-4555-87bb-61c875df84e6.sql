-- Add DELETE policy for admins on pet_friendly_places
CREATE POLICY "Admins can delete pet friendly places"
ON public.pet_friendly_places
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));