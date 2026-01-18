
-- Create analytics_events table for tracking user engagement
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_entity_type ON public.analytics_events(entity_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all analytics events
CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create membership_expiry_notifications table to track sent notifications
CREATE TABLE public.membership_expiry_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(membership_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.membership_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Allow admins to view expiry notifications
CREATE POLICY "Admins can view expiry notifications"
ON public.membership_expiry_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role to insert (for edge function)
CREATE POLICY "Service role can insert expiry notifications"
ON public.membership_expiry_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
