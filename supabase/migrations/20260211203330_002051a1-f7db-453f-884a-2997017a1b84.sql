-- Prevent future pet birthdays at the database level
CREATE OR REPLACE FUNCTION public.validate_pet_birthday()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthday IS NOT NULL AND NEW.birthday > CURRENT_DATE THEN
    RAISE EXCEPTION 'Birthday cannot be a future date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply on both insert and update
DROP TRIGGER IF EXISTS validate_pet_birthday_trigger ON public.pets;
CREATE TRIGGER validate_pet_birthday_trigger
  BEFORE INSERT OR UPDATE ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pet_birthday();