-- Create a function to notify users about new lost pet alerts in their cities
CREATE OR REPLACE FUNCTION public.notify_users_about_lost_pet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_pref RECORD;
  alert_city TEXT;
BEGIN
  -- Extract city from the last_seen_location (assuming format includes city name)
  alert_city := NEW.last_seen_location;
  
  -- Find all users who have notifications enabled and are interested in this city
  FOR user_pref IN
    SELECT user_id, cities
    FROM lost_pet_notification_preferences
    WHERE enabled = true
      AND user_id != NEW.owner_user_id  -- Don't notify the owner
      AND (
        -- Check if any of the user's selected cities match the alert location
        EXISTS (
          SELECT 1 FROM unnest(cities) AS city
          WHERE alert_city ILIKE '%' || city || '%'
        )
      )
  LOOP
    -- Create a notification for each matching user
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      user_pref.user_id,
      'lost_pet_alert',
      'Lost Pet Alert in Your Area',
      NEW.pet_name || ' (' || COALESCE(NEW.pet_breed, 'Unknown breed') || ') was last seen in ' || NEW.last_seen_location,
      jsonb_build_object(
        'alert_id', NEW.id,
        'pet_name', NEW.pet_name,
        'pet_breed', NEW.pet_breed,
        'location', NEW.last_seen_location,
        'photo_url', NEW.pet_photo_url
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_lost_pet_alert_created ON lost_pet_alerts;
CREATE TRIGGER on_lost_pet_alert_created
  AFTER INSERT ON lost_pet_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_about_lost_pet();