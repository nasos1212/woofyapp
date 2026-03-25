CREATE POLICY "Admins can update any alert"
ON public.lost_pet_alerts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));