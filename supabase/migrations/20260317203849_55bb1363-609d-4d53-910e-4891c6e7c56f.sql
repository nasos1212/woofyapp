
CREATE OR REPLACE FUNCTION public.notify_shelter_on_adoption_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  shelter_user_id UUID;
  pet_record RECORD;
BEGIN
  -- Get shelter's user_id
  SELECT user_id INTO shelter_user_id
  FROM shelters
  WHERE id = NEW.shelter_id;

  IF shelter_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get pet details
  SELECT name, pet_type INTO pet_record
  FROM shelter_adoptable_pets
  WHERE id = NEW.pet_id;

  -- Create notification for shelter
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    shelter_user_id,
    'adoption_inquiry',
    '🐾 New Adoption Inquiry',
    NEW.inquirer_name || ' is interested in adopting ' || COALESCE(pet_record.name, 'a pet') || '. Check your adoption inquiries to respond.',
    jsonb_build_object(
      'inquiry_id', NEW.id,
      'pet_id', NEW.pet_id,
      'pet_name', COALESCE(pet_record.name, 'Unknown'),
      'inquirer_name', NEW.inquirer_name,
      'inquirer_email', NEW.inquirer_email
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_adoption_inquiry_created
  AFTER INSERT ON public.adoption_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shelter_on_adoption_inquiry();
