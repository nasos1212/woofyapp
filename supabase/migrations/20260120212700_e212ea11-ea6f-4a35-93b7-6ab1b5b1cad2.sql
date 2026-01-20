-- Add RLS policy for admins to view all offer redemptions
CREATE POLICY "Admins can view all redemptions"
ON public.offer_redemptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));