-- Add photo_position column to lost_pet_alert_photos to store vertical crop position
ALTER TABLE public.lost_pet_alert_photos 
ADD COLUMN IF NOT EXISTS photo_position integer DEFAULT 50;