CREATE POLICY "Authenticated users can view approved businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  verification_status = 'approved'::verification_status
  AND COALESCE(is_hidden, false) = false
);