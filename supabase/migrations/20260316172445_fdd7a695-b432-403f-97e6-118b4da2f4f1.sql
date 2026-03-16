-- Add social media columns to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tiktok_url text;