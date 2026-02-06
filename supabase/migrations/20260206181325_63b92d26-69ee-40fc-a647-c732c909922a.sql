-- Drop the problematic policy
DROP POLICY IF EXISTS "Businesses can view customer memberships" ON public.memberships;

-- Create a security definer function to check if business can view membership
CREATE OR REPLACE FUNCTION public.business_can_view_membership(_business_user_id uuid, _membership_id uuid)
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
    WHERE r.membership_id = _membership_id 
      AND b.user_id = _business_user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Businesses can view customer memberships"
ON public.memberships FOR SELECT
USING (
  public.business_can_view_membership(auth.uid(), id)
);