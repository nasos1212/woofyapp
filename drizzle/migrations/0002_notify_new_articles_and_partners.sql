CREATE OR REPLACE FUNCTION public.notify_members_new_blog_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_blog_post',
      CASE WHEN p.preferred_language = 'el' THEN 'Νέο άρθρο στο Wooffy' ELSE 'New article on Wooffy' END,
      CASE WHEN p.preferred_language = 'el' THEN COALESCE(NEW.title_el, NEW.title_en) ELSE NEW.title_en END,
      jsonb_build_object('slug', NEW.slug, 'post_id', NEW.id)
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'member')
      AND p.deletion_requested_at IS NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_blog_post_published ON public.blog_posts;
CREATE TRIGGER on_blog_post_published AFTER INSERT OR UPDATE OF status ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_members_new_blog_post();

CREATE OR REPLACE FUNCTION public.notify_members_new_partner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND NOT NEW.is_hidden
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_partner',
      CASE WHEN p.preferred_language = 'el' THEN 'Νέος συνεργάτης στην περιοχή σας' ELSE 'New partner in your area' END,
      CASE WHEN p.preferred_language = 'el' THEN NEW.business_name || ' μόλις μπήκε στο Wooffy (' || p.preferred_city || ')'
           ELSE NEW.business_name || ' just joined Wooffy in ' || p.preferred_city END,
      jsonb_build_object('business_id', NEW.id)
    FROM profiles p
    WHERE p.preferred_city IS NOT NULL
      AND p.user_id <> NEW.user_id
      AND p.deletion_requested_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'member')
      AND (lower(NEW.city) = lower(p.preferred_city)
           OR EXISTS (SELECT 1 FROM business_locations l WHERE l.business_id = NEW.id AND lower(l.city) = lower(p.preferred_city)));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_business_approved ON public.businesses;
CREATE TRIGGER on_business_approved AFTER INSERT OR UPDATE OF verification_status ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.notify_members_new_partner();