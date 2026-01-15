-- Create storage bucket for lost pet photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lost-pet-photos', 'lost-pet-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view lost pet photos (public bucket)
CREATE POLICY "Lost pet photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'lost-pet-photos');

-- Allow authenticated users to upload their own lost pet photos
CREATE POLICY "Users can upload lost pet photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lost-pet-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'lost-pets'
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own lost pet photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lost-pet-photos'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own lost pet photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lost-pet-photos'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);