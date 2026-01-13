-- Add photo_url column to pets table
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own pet photos
CREATE POLICY "Users can upload pet photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own pet photos
CREATE POLICY "Users can update their pet photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own pet photos
CREATE POLICY "Users can delete their pet photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to pet photos
CREATE POLICY "Pet photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');