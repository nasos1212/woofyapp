-- Drop the existing policy and recreate with correct conditions
DROP POLICY IF EXISTS "Public can create messages for affiliate inquiries" ON public.support_messages;

-- Allow public to insert messages for affiliate inquiry conversations (sender_id can be null)
CREATE POLICY "Public can create messages for affiliate inquiries"
ON public.support_messages FOR INSERT
WITH CHECK (
  sender_type = 'user'
  AND EXISTS (
    SELECT 1 FROM support_conversations sc
    WHERE sc.id = conversation_id
    AND sc.category = 'affiliate'
  )
);