-- Add area/neighborhood column to pet_friendly_places for more precise location
ALTER TABLE public.pet_friendly_places 
ADD COLUMN IF NOT EXISTS area text;