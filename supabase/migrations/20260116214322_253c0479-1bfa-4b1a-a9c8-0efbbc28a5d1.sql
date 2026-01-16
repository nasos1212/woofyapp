-- Create table for lost pet alert photos (supporting multiple photos per alert)
CREATE TABLE public.lost_pet_alert_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.lost_pet_alerts(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lost_pet_alert_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos for active alerts (public view for community)
CREATE POLICY "Anyone can view lost pet photos"
ON public.lost_pet_alert_photos
FOR SELECT
USING (true);

-- Only alert owner can insert photos
CREATE POLICY "Alert owner can insert photos"
ON public.lost_pet_alert_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lost_pet_alerts
    WHERE id = alert_id AND owner_user_id = auth.uid()
  )
);

-- Only alert owner can delete photos
CREATE POLICY "Alert owner can delete photos"
ON public.lost_pet_alert_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lost_pet_alerts
    WHERE id = alert_id AND owner_user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_lost_pet_alert_photos_alert_id ON public.lost_pet_alert_photos(alert_id);