-- Drop the existing check constraint and add a new one that includes 'daily'
ALTER TABLE public.pet_health_records DROP CONSTRAINT IF EXISTS valid_interval_type;

ALTER TABLE public.pet_health_records 
ADD CONSTRAINT valid_interval_type 
CHECK (reminder_interval_type IS NULL OR reminder_interval_type IN ('once', 'daily', 'monthly', 'quarterly', 'biannually', 'yearly', 'custom'));