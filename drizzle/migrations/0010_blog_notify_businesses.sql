CREATE OR REPLACE FUNCTION public.notify_members_new_blog_post()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_blog_post',
      CASE WHEN p.preferred_language = 'el' THEN 'Νέο άρθρο στο Wooffy' ELSE 'New article on Wooffy' END,
      CASE WHEN p.preferred_language = 'el' THEN COALESCE(NEW.title_el, NEW.title_en) ELSE NEW.title_en END,
      jsonb_build_object('slug', NEW.slug, 'post_id', NEW.id)
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role IN ('member','business'))
      AND p.deletion_requested_at IS NULL;
  END IF;
  RETURN NEW;
END $function$;