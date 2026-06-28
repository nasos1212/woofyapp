CREATE POLICY "Anyone can view approved shelters"
  ON public.shelters
  FOR SELECT
  TO anon, authenticated
  USING (verification_status = 'approved'::verification_status AND is_hidden = false);