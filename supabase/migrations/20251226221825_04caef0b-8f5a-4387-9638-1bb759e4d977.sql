-- Create a security definer function to check membership access without RLS recursion
CREATE OR REPLACE FUNCTION public.user_has_membership_access(_user_id uuid, _membership_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships WHERE id = _membership_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM membership_shares WHERE membership_id = _membership_id AND shared_with_user_id = _user_id
  )
$$;

-- Create a simpler function to check if user owns any membership
CREATE OR REPLACE FUNCTION public.user_owns_membership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships WHERE user_id = _user_id
  )
$$;

-- Drop and recreate the memberships SELECT policy without recursion
DROP POLICY IF EXISTS "Users can view their membership or shared membership" ON public.memberships;

CREATE POLICY "Users can view own membership" 
ON public.memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared membership" 
ON public.memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM membership_shares 
    WHERE membership_shares.membership_id = memberships.id 
    AND membership_shares.shared_with_user_id = auth.uid()
  )
);