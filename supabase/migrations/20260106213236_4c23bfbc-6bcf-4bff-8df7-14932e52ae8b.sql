-- Table for tracking user activity/behavior
CREATE TABLE public.user_activity_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'page_view', 'feature_use', 'offer_view', 'search', etc.
  activity_data JSONB DEFAULT '{}'::jsonb, -- flexible data for different activity types
  page_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_tracking ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
ON public.user_activity_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
ON public.user_activity_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_activity_user_id ON public.user_activity_tracking(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity_tracking(activity_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity_tracking(created_at DESC);

-- Table for AI-generated proactive alerts
CREATE TABLE public.ai_proactive_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'vaccination_due', 'birthday_coming', 'offer_suggestion', 'health_tip'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_proactive_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own alerts"
ON public.ai_proactive_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own alerts (mark as read/dismissed)
CREATE POLICY "Users can update own alerts"
ON public.ai_proactive_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_ai_alerts_user_id ON public.ai_proactive_alerts(user_id);
CREATE INDEX idx_ai_alerts_unread ON public.ai_proactive_alerts(user_id, is_read, is_dismissed) WHERE NOT is_read AND NOT is_dismissed;