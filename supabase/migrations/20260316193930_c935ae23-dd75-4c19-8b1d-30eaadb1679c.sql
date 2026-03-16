CREATE POLICY "Business owners can view their analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  entity_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = analytics_events.entity_id::uuid
      AND businesses.user_id = auth.uid()
  )
);