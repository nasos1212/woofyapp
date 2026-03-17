
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_type TEXT;
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
  END IF;
  
  RETURN NEW;
END;
$function$;
