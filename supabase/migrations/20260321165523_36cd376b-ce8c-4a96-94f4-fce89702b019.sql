
-- Update the trigger function to use max_pets = 5 for free members
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_member_number TEXT;
  current_year INT := EXTRACT(YEAR FROM NOW())::INT;
  seq_val INT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Generate member number
  INSERT INTO public.member_number_sequences (year, current_value)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE SET current_value = member_number_sequences.current_value + 1
  RETURNING current_value INTO seq_val;

  new_member_number := 'WOOF-' || current_year || '-' || LPAD(seq_val::TEXT, 4, '0');

  -- Create free membership
  INSERT INTO public.memberships (user_id, member_number, plan_type, is_active, max_pets, expires_at)
  VALUES (
    NEW.id,
    new_member_number,
    'free',
    true,
    5,
    (NOW() + INTERVAL '100 years')
  );

  RETURN NEW;
END;
$$;

-- Backfill existing free memberships from 99 to 5
UPDATE public.memberships SET max_pets = 5 WHERE plan_type = 'free' AND max_pets = 99;
