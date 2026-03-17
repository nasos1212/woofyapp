ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_tour_seen_at TIMESTAMP WITH TIME ZONE;

UPDATE public.profiles
SET onboarding_tour_seen_at = COALESCE(onboarding_tour_seen_at, now()),
    updated_at = now()
WHERE onboarding_tour_seen_at IS NULL;