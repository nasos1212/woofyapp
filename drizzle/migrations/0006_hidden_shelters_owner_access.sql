DROP POLICY IF EXISTS "Hidden shelters are admin only" ON public.shelters;
CREATE POLICY "Hidden shelters are admin only" ON public.shelters AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING ((NOT is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Hidden shelters cannot be edited by non admins" ON public.shelters;
CREATE POLICY "Hidden shelters cannot be edited by non admins" ON public.shelters AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((NOT is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id)
WITH CHECK ((NOT is_hidden) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);