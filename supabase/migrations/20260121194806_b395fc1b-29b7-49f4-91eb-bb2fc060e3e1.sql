-- Create a function to assign the business role when a business is created
CREATE OR REPLACE FUNCTION public.assign_business_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add business role to the user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'business')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign business role when a business is created
CREATE TRIGGER on_business_created_assign_role
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_business_role();