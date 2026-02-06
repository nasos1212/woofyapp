-- Add a metadata column to support_conversations for storing affiliate details
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;