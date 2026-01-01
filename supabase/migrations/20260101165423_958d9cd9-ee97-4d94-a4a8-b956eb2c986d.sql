-- CRITICAL FIX: Remove the dangerous policy that allows users to self-elevate to admin
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;