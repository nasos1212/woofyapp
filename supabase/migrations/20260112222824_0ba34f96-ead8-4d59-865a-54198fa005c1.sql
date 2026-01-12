-- Add gender column to pets table
ALTER TABLE public.pets 
ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'unknown'));

-- Add age_years column for when exact birthday is unknown
ALTER TABLE public.pets 
ADD COLUMN age_years integer;