
-- Fix the assign_business_role function to remove member role (matching shelter logic)
CREATE OR REPLACE FUNCTION public.assign_business_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove member role if it exists (business users are not members)
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'member';
  
  -- Add business role to the user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'business')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
