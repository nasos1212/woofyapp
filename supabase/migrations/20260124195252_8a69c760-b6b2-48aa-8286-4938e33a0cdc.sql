-- Create function to notify businesses about newly added pets with upcoming birthdays
CREATE OR REPLACE FUNCTION public.notify_businesses_on_pet_birthday_add()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today_date DATE;
  this_year_birthday DATE;
  days_until INTEGER;
  business_record RECORD;
  owner_profile RECORD;
  pet_age INTEGER;
  days_message TEXT;
BEGIN
  -- Only process if birthday is set
  IF NEW.birthday IS NULL THEN
    RETURN NEW;
  END IF;

  today_date := CURRENT_DATE;
  
  -- Calculate this year's birthday
  this_year_birthday := make_date(
    EXTRACT(YEAR FROM today_date)::INTEGER,
    EXTRACT(MONTH FROM NEW.birthday)::INTEGER,
    EXTRACT(DAY FROM NEW.birthday)::INTEGER
  );
  
  -- If birthday already passed this year, use next year
  IF this_year_birthday < today_date THEN
    this_year_birthday := make_date(
      EXTRACT(YEAR FROM today_date)::INTEGER + 1,
      EXTRACT(MONTH FROM NEW.birthday)::INTEGER,
      EXTRACT(DAY FROM NEW.birthday)::INTEGER
    );
  END IF;
  
  days_until := this_year_birthday - today_date;
  
  -- Only notify if birthday is within 0-3 days
  IF days_until < 0 OR days_until > 3 THEN
    RETURN NEW;
  END IF;
  
  -- Calculate age
  pet_age := EXTRACT(YEAR FROM this_year_birthday)::INTEGER - EXTRACT(YEAR FROM NEW.birthday)::INTEGER;
  
  -- Get owner profile
  SELECT full_name INTO owner_profile FROM profiles WHERE user_id = NEW.owner_user_id;
  
  -- Customize days message
  IF days_until = 0 THEN
    days_message := 'today! 🎉';
  ELSE
    days_message := 'in ' || days_until || ' day' || CASE WHEN days_until != 1 THEN 's' ELSE '' END || '!';
  END IF;
  
  -- Find businesses with birthday reminders enabled that have redemptions from this pet's membership
  FOR business_record IN 
    SELECT DISTINCT b.id, b.business_name, b.user_id
    FROM businesses b
    INNER JOIN business_birthday_settings bbs ON bbs.business_id = b.id AND bbs.enabled = true
    INNER JOIN offer_redemptions r ON r.business_id = b.id AND r.membership_id = NEW.membership_id
    WHERE b.verification_status = 'approved'
  LOOP
    -- Check if notification already exists today for this pet and business
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = business_record.user_id
        AND type = 'business_birthday_reminder'
        AND (data->>'pet_id')::uuid = NEW.id
        AND created_at::date = today_date
    ) THEN
      -- Create notification for business
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        business_record.user_id,
        'business_birthday_reminder',
        CASE WHEN days_until = 0 
          THEN '🎂 It''s ' || NEW.pet_name || '''s Birthday Today!'
          ELSE '🎂 Upcoming Pet Birthday: ' || NEW.pet_name
        END,
        COALESCE(owner_profile.full_name, 'A customer') || '''s pet ' || NEW.pet_name || 
        ' (' || COALESCE(NEW.pet_breed, 'Pet') || ') is turning ' || pet_age || ' ' || days_message ||
        ' Consider sending them a birthday offer.',
        jsonb_build_object(
          'pet_id', NEW.id,
          'pet_name', NEW.pet_name,
          'pet_breed', NEW.pet_breed,
          'owner_user_id', NEW.owner_user_id,
          'owner_name', COALESCE(owner_profile.full_name, 'A customer'),
          'birthday', NEW.birthday,
          'age', pet_age,
          'days_until', days_until,
          'triggered_by', 'pet_creation'
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on pet insert
DROP TRIGGER IF EXISTS trigger_notify_businesses_on_pet_birthday ON pets;
CREATE TRIGGER trigger_notify_businesses_on_pet_birthday
  AFTER INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION notify_businesses_on_pet_birthday_add();

-- Also handle birthday updates (in case user edits birthday to be within window)
DROP TRIGGER IF EXISTS trigger_notify_businesses_on_pet_birthday_update ON pets;
CREATE TRIGGER trigger_notify_businesses_on_pet_birthday_update
  AFTER UPDATE OF birthday ON pets
  FOR EACH ROW
  WHEN (NEW.birthday IS DISTINCT FROM OLD.birthday)
  EXECUTE FUNCTION notify_businesses_on_pet_birthday_add();