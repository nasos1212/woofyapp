-- Update the check constraint to allow 'once' as a valid interval type
ALTER TABLE public.pet_health_records
DROP CONSTRAINT IF EXISTS valid_interval_type;

ALTER TABLE public.pet_health_records
ADD CONSTRAINT valid_interval_type CHECK (
  reminder_interval_type IN ('once', 'monthly', 'quarterly', 'biannually', 'yearly', 'custom')
);