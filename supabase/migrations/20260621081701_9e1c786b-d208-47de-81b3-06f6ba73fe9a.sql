-- Remove the over-broad policy that exposed full profile rows (including email/phone)
-- to business owners for any customer who had ever redeemed at their business.
DROP POLICY IF EXISTS "Businesses can view customer profiles" ON public.profiles;

-- Helper: returns only id + full_name for users who have redeemed at the caller's
-- business. SECURITY DEFINER bypasses RLS but the WHERE clause enforces the same
-- access scope, never returning email or phone.
CREATE OR REPLACE FUNCTION public.get_business_customer_names(_user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.pets pet
      JOIN public.offer_redemptions r ON r.membership_id = pet.membership_id
      JOIN public.businesses b ON b.id = r.business_id
      WHERE pet.owner_user_id = p.user_id
        AND b.user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_business_customer_names(uuid[]) TO authenticated;