-- Add language preference column to profiles
ALTER TABLE public.profiles
ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language code for AI responses (e.g., en, el, es, de, fr, it, pt, ru, ar, tr)';