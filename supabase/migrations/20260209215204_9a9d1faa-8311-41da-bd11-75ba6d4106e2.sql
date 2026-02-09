-- Add reminder_days_before column to pet_health_records
-- Stores an array of integers representing days before the due date to remind
-- e.g., [3, 1, 0] means "3 days before, 1 day before, and on the day"
-- Used for non-vaccination/medication record types (surgery, vet_visit, allergy, other)
ALTER TABLE public.pet_health_records
ADD COLUMN reminder_days_before integer[] DEFAULT NULL;