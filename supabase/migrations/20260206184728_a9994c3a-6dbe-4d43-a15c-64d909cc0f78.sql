-- Allow admins to delete support messages
CREATE POLICY "Admins can delete messages"
ON public.support_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to delete support conversations
CREATE POLICY "Admins can delete conversations"
ON public.support_conversations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);