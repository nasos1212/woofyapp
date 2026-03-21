CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_type TEXT;
  new_member_number TEXT;
  current_year INT;
  seq_val INT;
BEGIN
  -- Extract account type from metadata
  account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'member');

  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Assign role based on account type
  IF account_type IN ('member', 'business', 'shelter') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, account_type::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default to member role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Only create free membership for member accounts
  IF account_type = 'member' OR account_type IS NULL THEN
    current_year := EXTRACT(YEAR FROM NOW())::INT;

    INSERT INTO public.member_number_sequences (year, current_value)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE SET current_value = member_number_sequences.current_value + 1
    RETURNING current_value INTO seq_val;

    new_member_number := 'WF-' || current_year || '-' || seq_val::TEXT;

    INSERT INTO public.memberships (user_id, member_number, plan_type, is_active, max_pets, expires_at)
    VALUES (
      NEW.id,
      new_member_number,
      'free',
      true,
      5,
      (NOW() + INTERVAL '100 years')
    );
  END IF;

  RETURN NEW;
END;
$$;