-- Create storage bucket for shelter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('shelter-photos', 'shelter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their shelter's folder
CREATE POLICY "Shelters can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shelter-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.shelters WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to update their shelter's photos
CREATE POLICY "Shelters can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shelter-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.shelters WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to delete their shelter's photos
CREATE POLICY "Shelters can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shelter-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.shelters WHERE user_id = auth.uid()
  )
);

-- Allow public viewing of shelter photos
CREATE POLICY "Public can view shelter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'shelter-photos');