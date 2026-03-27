
-- Create pet_documents table
CREATE TABLE public.pet_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own pet documents
CREATE POLICY "Users can view their own pet documents"
  ON public.pet_documents FOR SELECT
  USING (owner_user_id = auth.uid());

-- Users can insert their own pet documents
CREATE POLICY "Users can insert their own pet documents"
  ON public.pet_documents FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Users can update their own pet documents
CREATE POLICY "Users can update their own pet documents"
  ON public.pet_documents FOR UPDATE
  USING (owner_user_id = auth.uid());

-- Users can delete their own pet documents
CREATE POLICY "Users can delete their own pet documents"
  ON public.pet_documents FOR DELETE
  USING (owner_user_id = auth.uid());

-- Create storage bucket for pet documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-documents', 'pet-documents', false);

-- Storage policies for pet-documents bucket
CREATE POLICY "Users can upload pet documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their pet documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their pet documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
