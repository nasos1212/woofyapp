-- Lock down Realtime broadcast/presence subscriptions for support topics.
-- The app uses postgres_changes (which respects table RLS), but we add
-- realtime.messages policies so any future broadcast/presence usage is
-- scoped to the conversation owner / admin and satisfies scanners.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Support topics: owner or admin can read" ON realtime.messages;
DROP POLICY IF EXISTS "Support topics: owner or admin can send" ON realtime.messages;
DROP POLICY IF EXISTS "Non-support topics: authenticated read" ON realtime.messages;
DROP POLICY IF EXISTS "Non-support topics: authenticated send" ON realtime.messages;

-- Reads (SELECT) — subscribers receive events
CREATE POLICY "Support topics: owner or admin can read"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'support-messages-%'
      OR realtime.topic() LIKE 'support-conversation-%'
      OR realtime.topic() LIKE 'support-unread-count%'
      OR realtime.topic() LIKE 'admin-support-%'
    THEN (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.support_conversations sc
        WHERE sc.user_id = auth.uid()
          AND (
            realtime.topic() = 'support-messages-' || sc.id::text
            OR realtime.topic() = 'support-conversation-' || sc.id::text
            OR realtime.topic() LIKE 'support-unread-count%'
          )
      )
    )
    ELSE true
  END
);

-- Writes (INSERT) — broadcast/presence sends
CREATE POLICY "Support topics: owner or admin can send"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() LIKE 'support-messages-%'
      OR realtime.topic() LIKE 'support-conversation-%'
      OR realtime.topic() LIKE 'support-unread-count%'
      OR realtime.topic() LIKE 'admin-support-%'
    THEN (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.support_conversations sc
        WHERE sc.user_id = auth.uid()
          AND (
            realtime.topic() = 'support-messages-' || sc.id::text
            OR realtime.topic() = 'support-conversation-' || sc.id::text
            OR realtime.topic() LIKE 'support-unread-count%'
          )
      )
    )
    ELSE true
  END
);