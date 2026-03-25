-- Allow admins to manage alert photos
CREATE POLICY "Admins can insert alert photos"
ON public.lost_pet_alert_photos
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alert photos"
ON public.lost_pet_alert_photos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));