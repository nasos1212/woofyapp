-- Create function to assign shelter role when a shelter is created (mirrors assign_business_role)
CREATE OR REPLACE FUNCTION public.assign_shelter_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove member role if it exists (shelter users are not members)
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'member';
  
  -- Add shelter role to the user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'shelter')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-assign shelter role when shelter record is created
CREATE TRIGGER on_shelter_created
  AFTER INSERT ON public.shelters
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_shelter_role();

-- Also update existing shelters that have wrong roles - fix any shelter with "member" role
UPDATE public.user_roles 
SET role = 'shelter'
WHERE role = 'member' 
AND user_id IN (SELECT user_id FROM public.shelters);