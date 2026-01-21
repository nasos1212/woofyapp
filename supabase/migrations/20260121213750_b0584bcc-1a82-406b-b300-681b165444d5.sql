-- Allow admins to view all sent birthday offers for analytics
CREATE POLICY "Admins can view all sent birthday offers" 
ON public.sent_birthday_offers 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow pet owners to view birthday offers sent to them
CREATE POLICY "Pet owners can view their received birthday offers" 
ON public.sent_birthday_offers 
FOR SELECT 
USING (owner_user_id = auth.uid());