-- Drop the existing check constraint and add a new one with more place types
ALTER TABLE pet_friendly_places DROP CONSTRAINT IF EXISTS pet_friendly_places_place_type_check;

ALTER TABLE pet_friendly_places ADD CONSTRAINT pet_friendly_places_place_type_check 
CHECK (place_type IN ('beach', 'cafe', 'restaurant', 'hotel', 'park', 'other'));