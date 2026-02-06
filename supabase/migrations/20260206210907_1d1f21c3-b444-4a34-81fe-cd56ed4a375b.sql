-- Update the notify_users_about_lost_pet function to use the correct page name
CREATE OR REPLACE FUNCTION notify_users_about_lost_pet()
RETURNS TRIGGER AS $$
DECLARE
  user_pref RECORD;
  alert_city TEXT;
  alert_title TEXT;
BEGIN
  -- Extract city from the last_seen_location (assuming format includes city name)
  alert_city := NEW.last_seen_location;
  
  -- Set title based on alert type
  IF NEW.alert_type = 'found' THEN
    alert_title := 'Found Pet Alert in Your Area';
  ELSE
    alert_title := 'Lost Pet Alert in Your Area';
  END IF;
  
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
      alert_title,
      NEW.pet_name || ' (' || COALESCE(NEW.pet_breed, 'Unknown breed') || ') was last seen in ' || NEW.last_seen_location,
      jsonb_build_object(
        'alert_id', NEW.id,
        'pet_name', NEW.pet_name,
        'pet_breed', NEW.pet_breed,
        'location', NEW.last_seen_location,
        'photo_url', NEW.pet_photo_url,
        'alert_type', NEW.alert_type
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;