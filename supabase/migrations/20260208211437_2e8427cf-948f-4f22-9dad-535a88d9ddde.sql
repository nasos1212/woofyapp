-- Create a sequence table to track member numbers per year
CREATE TABLE IF NOT EXISTS public.member_number_sequences (
  year INTEGER PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0
);

-- Insert current year if not exists
INSERT INTO public.member_number_sequences (year, current_value)
VALUES (EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (year) DO NOTHING;

-- Update the generate_member_number function to use sequential numbering
CREATE OR REPLACE FUNCTION public.generate_member_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
  new_member_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Insert year if not exists, then increment and return the new value
  INSERT INTO public.member_number_sequences (year, current_value)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE SET current_value = member_number_sequences.current_value + 1
  RETURNING current_value INTO next_number;
  
  -- Format: WF-YYYY-N (no zero padding)
  new_member_number := 'WF-' || current_year::TEXT || '-' || next_number::TEXT;
  
  RETURN new_member_number;
END;
$$;

-- Enable RLS on the sequence table (read-only for authenticated users)
ALTER TABLE public.member_number_sequences ENABLE ROW LEVEL SECURITY;

-- Only allow the function to modify (via SECURITY DEFINER)
CREATE POLICY "Anyone can read sequences"
  ON public.member_number_sequences
  FOR SELECT
  TO authenticated
  USING (true);