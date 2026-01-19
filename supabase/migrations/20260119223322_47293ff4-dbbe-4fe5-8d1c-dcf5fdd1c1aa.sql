-- Allow admins to view all business locations
CREATE POLICY "Admins can view all business locations"
  ON public.business_locations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));