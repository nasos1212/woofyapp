CREATE OR REPLACE FUNCTION public.notify_members_new_shelter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND NOT NEW.is_hidden
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_shelter',
      CASE WHEN p.preferred_language = 'el' THEN 'Νέο καταφύγιο στην περιοχή σας' ELSE 'New shelter in your area' END,
      CASE WHEN p.preferred_language = 'el' THEN NEW.shelter_name || ' μόλις μπήκε στο Wooffy (' || p.preferred_city || ')'
           ELSE NEW.shelter_name || ' just joined Wooffy in ' || p.preferred_city END,
      jsonb_build_object('shelter_id', NEW.id)
    FROM profiles p
    WHERE p.preferred_city IS NOT NULL
      AND p.user_id IS DISTINCT FROM NEW.user_id
      AND p.deletion_requested_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'member')
      AND (lower(NEW.city) = lower(p.preferred_city) OR NEW.location ILIKE '%' || p.preferred_city || '%');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_shelter_approved ON public.shelters;
CREATE TRIGGER on_shelter_approved AFTER INSERT OR UPDATE OF verification_status ON public.shelters
FOR EACH ROW EXECUTE FUNCTION public.notify_members_new_shelter();