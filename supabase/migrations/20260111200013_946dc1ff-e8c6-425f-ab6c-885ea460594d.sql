-- Create storage bucket for health record documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-documents', 'health-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload health documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'health-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own health documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'health-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own health documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'health-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);