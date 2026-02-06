-- Allow public (unauthenticated) users to create affiliate inquiry conversations
CREATE POLICY "Public can create affiliate inquiries"
ON public.support_conversations FOR INSERT
WITH CHECK (
  category = 'affiliate' 
  AND user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Allow public to insert messages for affiliate inquiry conversations
CREATE POLICY "Public can create messages for affiliate inquiries"
ON public.support_messages FOR INSERT
WITH CHECK (
  sender_type = 'user'
  AND sender_id IS NULL
  AND EXISTS (
    SELECT 1 FROM support_conversations sc
    WHERE sc.id = conversation_id
    AND sc.category = 'affiliate'
    AND sc.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);