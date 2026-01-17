-- Add 'shelter' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shelter';

-- Add RLS policy for shelters to view their own shelter record
CREATE POLICY "Shelter owners can view their shelter"
ON public.shelters
FOR SELECT
USING (auth.uid() = user_id);

-- Add policy for shelter owners to manage their photos
CREATE POLICY "Shelter owners can insert photos"
ON public.shelter_photos
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM shelters
  WHERE shelters.id = shelter_photos.shelter_id
  AND shelters.user_id = auth.uid()
));

CREATE POLICY "Shelter owners can update photos"
ON public.shelter_photos
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM shelters
  WHERE shelters.id = shelter_photos.shelter_id
  AND shelters.user_id = auth.uid()
));

CREATE POLICY "Shelter owners can delete photos"
ON public.shelter_photos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM shelters
  WHERE shelters.id = shelter_photos.shelter_id
  AND shelters.user_id = auth.uid()
));