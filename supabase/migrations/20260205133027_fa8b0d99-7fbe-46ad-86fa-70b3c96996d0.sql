-- Add google_maps_url column to pet_friendly_places
ALTER TABLE public.pet_friendly_places 
ADD COLUMN google_maps_url text;