-- Add preferred_time column to pet_health_records for daily medication reminders
ALTER TABLE public.pet_health_records 
ADD COLUMN preferred_time TIME DEFAULT NULL;