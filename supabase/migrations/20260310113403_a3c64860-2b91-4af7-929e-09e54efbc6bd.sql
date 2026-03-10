
ALTER TABLE public.pet_friendly_place_requests ADD COLUMN submitted_by TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE public.pet_friendly_places ADD COLUMN submitted_by TEXT DEFAULT NULL;
