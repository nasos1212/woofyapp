
-- Update handle_new_user to auto-create a free membership for member accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_type TEXT;
  new_member_number TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Check account type from user metadata
  account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'member');
  
  IF account_type = 'business' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'business')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF account_type = 'shelter' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'shelter')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Auto-create a free membership for member accounts
    new_member_number := public.generate_member_number();
    INSERT INTO public.memberships (user_id, member_number, plan_type, max_pets, is_active, expires_at)
    VALUES (
      NEW.id,
      new_member_number,
      'free',
      99,
      true,
      '2099-12-31T23:59:59Z'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Backfill: Create free memberships for existing member-role users who don't have one
INSERT INTO public.memberships (user_id, member_number, plan_type, max_pets, is_active, expires_at)
SELECT 
  ur.user_id,
  public.generate_member_number(),
  'free',
  99,
  true,
  '2099-12-31T23:59:59Z'
FROM public.user_roles ur
WHERE ur.role = 'member'
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships m WHERE m.user_id = ur.user_id
  );
