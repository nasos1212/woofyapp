-- Add reminder_interval column to pet_health_records
-- This allows different intervals: monthly, quarterly, biannually, yearly, or custom days
ALTER TABLE public.pet_health_records
ADD COLUMN reminder_interval_type text DEFAULT 'yearly',
ADD COLUMN reminder_interval_days integer DEFAULT 365;

-- Add a check constraint for valid interval types
ALTER TABLE public.pet_health_records
ADD CONSTRAINT valid_interval_type CHECK (
  reminder_interval_type IN ('monthly', 'quarterly', 'biannually', 'yearly', 'custom')
);

COMMENT ON COLUMN public.pet_health_records.reminder_interval_type IS 'Type of reminder interval: monthly, quarterly, biannually, yearly, or custom';
COMMENT ON COLUMN public.pet_health_records.reminder_interval_days IS 'Number of days between reminders (used for custom intervals or calculated from type)';