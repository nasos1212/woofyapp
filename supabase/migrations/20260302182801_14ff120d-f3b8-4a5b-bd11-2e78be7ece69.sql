ALTER TABLE public.pet_friendly_places DROP CONSTRAINT pet_friendly_places_place_type_check;

ALTER TABLE public.pet_friendly_places ADD CONSTRAINT pet_friendly_places_place_type_check 
CHECK (place_type = ANY (ARRAY['beach'::text, 'cafe'::text, 'restaurant'::text, 'hotel'::text, 'park'::text, 'nature_trail'::text, 'other'::text]));