-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Users can view shared membership" ON public.memberships;

-- Also fix membership_shares policies to avoid recursion
DROP POLICY IF EXISTS "Membership owners can view shares" ON public.membership_shares;
DROP POLICY IF EXISTS "Membership owners can delete shares" ON public.membership_shares;

-- Create a function to check if user owns a specific membership
CREATE OR REPLACE FUNCTION public.is_membership_owner(_user_id uuid, _membership_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships WHERE id = _membership_id AND user_id = _user_id
  )
$$;

-- Create a function to check if user is shared on a membership
CREATE OR REPLACE FUNCTION public.is_membership_shared_with(_user_id uuid, _membership_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM membership_shares WHERE membership_id = _membership_id AND shared_with_user_id = _user_id
  )
$$;

-- Recreate membership_shares policies using security definer functions
CREATE POLICY "Membership owners can view shares" 
ON public.membership_shares 
FOR SELECT 
USING (
  public.is_membership_owner(auth.uid(), membership_id) 
  OR shared_with_user_id = auth.uid()
);

CREATE POLICY "Membership owners can delete shares" 
ON public.membership_shares 
FOR DELETE 
USING (public.is_membership_owner(auth.uid(), membership_id));

-- Recreate memberships shared access policy using security definer function
CREATE POLICY "Users can view shared membership" 
ON public.memberships 
FOR SELECT 
USING (public.is_membership_shared_with(auth.uid(), id));