
-- Add review_text and photo_url columns to pet_friendly_place_ratings
ALTER TABLE public.pet_friendly_place_ratings 
ADD COLUMN review_text text,
ADD COLUMN photo_url text;

-- Create storage bucket for place review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('place-review-photos', 'place-review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own review photos
CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'place-review-photos' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'place-review-photos');

-- Allow users to delete their own review photos
CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
