-- Add preferred_city to profiles for location-based offer filtering
ALTER TABLE public.profiles 
ADD COLUMN preferred_city TEXT;

-- Add index for efficient city-based queries
CREATE INDEX idx_profiles_preferred_city ON public.profiles(preferred_city);

-- Comment explaining the purpose
COMMENT ON COLUMN public.profiles.preferred_city IS 'User-selected city for showing nearby offers. Privacy-respecting alternative to GPS tracking.';