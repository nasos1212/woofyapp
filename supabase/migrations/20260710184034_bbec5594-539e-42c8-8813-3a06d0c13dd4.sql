CREATE OR REPLACE FUNCTION public.business_can_view_pet(_business_user_id uuid, _pet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_redemptions r
    JOIN public.businesses b ON b.id = r.business_id
    WHERE r.pet_id = _pet_id
      AND b.user_id = _business_user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_redeemed_at_business(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_redemptions r
    WHERE r.business_id = _business_id
      AND r.redeemed_by_user_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Businesses can view specific redeemed pets only" ON public.pets;
CREATE POLICY "Businesses can view specific redeemed pets only"
ON public.pets
FOR SELECT
USING (public.business_can_view_pet(auth.uid(), id));

DROP POLICY IF EXISTS "Users can view businesses where they redeemed offers" ON public.businesses;
CREATE POLICY "Users can view businesses where they redeemed offers"
ON public.businesses
FOR SELECT
TO authenticated
USING (public.user_redeemed_at_business(auth.uid(), id));

-- Re-assert required Data API grants for the affected tables and public partner view.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_redemptions TO authenticated;
GRANT ALL ON public.offer_redemptions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

GRANT SELECT ON public.businesses_public TO anon, authenticated;
GRANT ALL ON public.businesses_public TO service_role;