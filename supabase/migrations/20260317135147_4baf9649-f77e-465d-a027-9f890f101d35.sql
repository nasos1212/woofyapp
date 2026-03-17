-- Add tiktok_url to shelters (matching businesses)
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS tiktok_url text;
