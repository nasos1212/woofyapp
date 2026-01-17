-- Add cover photo position field to shelters table
ALTER TABLE public.shelters 
ADD COLUMN IF NOT EXISTS cover_photo_position integer DEFAULT 50;

-- Position represents the Y-axis percentage (0-100) for where the image should be centered