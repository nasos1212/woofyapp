-- SECURITY FIX: Tighten storage policy to verify business ownership
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Business owners can upload photos" ON storage.objects;

-- Create a more restrictive policy that:
-- 1. Requires authentication
-- 2. Verifies the user owns a business
-- 3. Enforces folder structure: user_id/business_id/filename
CREATE POLICY "Business owners can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE user_id = auth.uid()
  )
);

-- Also add policies for UPDATE and DELETE to ensure owners can manage their photos
DROP POLICY IF EXISTS "Business owners can update their photos" ON storage.objects;
CREATE POLICY "Business owners can update their photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Business owners can delete their photos" ON storage.objects;
CREATE POLICY "Business owners can delete their photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);