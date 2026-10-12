CREATE OR REPLACE FUNCTION public.notify_members_new_shelter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.verification_status = 'approved' AND NOT NEW.is_hidden
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_shelter',
      CASE WHEN p.preferred_language = 'el' THEN 'Νέο καταφύγιο στο Wooffy' ELSE 'New shelter on Wooffy' END,
      CASE WHEN p.preferred_language = 'el' THEN NEW.shelter_name || ' μόλις μπήκε στο Wooffy'
           ELSE NEW.shelter_name || ' just joined Wooffy' END,
      jsonb_build_object('shelter_id', NEW.id)
    FROM profiles p
    WHERE p.user_id IS DISTINCT FROM NEW.user_id
      AND p.deletion_requested_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'member');
  END IF;
  RETURN NEW;
END $function$;