CREATE POLICY "Admins can view all health records"
ON public.pet_health_records
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));