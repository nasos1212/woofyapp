CREATE OR REPLACE FUNCTION public.notify_members_new_blog_post()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_blog_post', 'New article on Wooffy', NEW.title_en,
      jsonb_build_object('slug', NEW.slug, 'post_id', NEW.id)
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role IN ('member','business','shelter'))
      AND p.deletion_requested_at IS NULL;
  END IF;
  RETURN NEW;
END $function$;