CREATE OR REPLACE FUNCTION public.dispatch_health_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delivered_count integer;
BEGIN
 WITH eligible AS (
 SELECT r.id AS record_id,r.owner_user_id,r.pet_id,r.title,p.pet_name,o.event_date,o.days_until
 FROM public.pet_health_records r JOIN public.pets p ON p.id=r.pet_id AND p.owner_user_id=r.owner_user_id
 JOIN public.profiles pr ON pr.user_id=r.owner_user_id AND pr.deletion_requested_at IS NULL
 CROSS JOIN LATERAL public.health_reminder_occurrence(r.record_type,r.reminder_interval_type,r.next_due_date,r.preferred_time,r.reminder_days_before,now()) o
 WHERE EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=r.owner_user_id AND ur.role='member')),
 claimed AS (
 INSERT INTO public.health_reminder_deliveries(record_id,owner_user_id,event_date,days_until)
 SELECT record_id,owner_user_id,event_date,days_until FROM eligible ON CONFLICT(record_id,event_date,days_until) DO NOTHING RETURNING record_id,event_date,days_until),
 sent AS (
 INSERT INTO public.notifications(user_id,type,title,message,data)
 SELECT e.owner_user_id,'reminder','Reminder for ' || e.pet_name,
 e.title || CASE WHEN e.days_until=-1 THEN ' was due yesterday.' WHEN e.days_until=0 THEN ' is due today.' ELSE ' is due in ' || e.days_until || ' days.' END,
 jsonb_build_object('pet_id',e.pet_id,'health_record_id',e.record_id,'due_date',e.event_date,'days_until',e.days_until,'action_url','https://wooffy.app/member/health-records?pet=' || e.pet_id)
 FROM eligible e JOIN claimed c USING(record_id,event_date,days_until) RETURNING id)
 SELECT count(*) INTO delivered_count FROM sent;
 RETURN delivered_count;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_health_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_health_reminders() TO service_role;

CREATE OR REPLACE FUNCTION public.notify_members_new_blog_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_blog_post', 'New article on Wooffy', NEW.title_en,
      jsonb_build_object('slug', NEW.slug, 'post_id', NEW.id)
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role IN ('member','business'))
      AND p.deletion_requested_at IS NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_members_new_partner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND NOT NEW.is_hidden
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_partner', 'New partner in your area',
      NEW.business_name || ' just joined Wooffy in ' || p.preferred_city,
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

CREATE OR REPLACE FUNCTION public.notify_members_new_shelter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND NOT NEW.is_hidden
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT p.user_id, 'new_shelter', 'New shelter on Wooffy',
      NEW.shelter_name || ' just joined Wooffy', jsonb_build_object('shelter_id', NEW.id)
    FROM profiles p
    WHERE p.user_id IS DISTINCT FROM NEW.user_id
      AND p.deletion_requested_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'member');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_followers_on_answer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE question_record RECORD;
BEGIN
  SELECT id, title, user_id INTO question_record
  FROM public.community_questions WHERE id = NEW.question_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT p.user_id, 'community_follow_activity', 'New reply to a question you engaged with',
    question_record.title, jsonb_build_object('question_id', question_record.id, 'answer_id', NEW.id)
  FROM public.profiles p
  JOIN (
    SELECT user_id FROM public.community_question_followers WHERE question_id = NEW.question_id
    UNION SELECT user_id FROM public.community_saved_questions WHERE question_id = NEW.question_id
    UNION SELECT user_id FROM public.community_helped WHERE question_id = NEW.question_id
    UNION SELECT user_id FROM public.community_answers WHERE question_id = NEW.question_id
    UNION SELECT v.user_id FROM public.community_votes v
    JOIN public.community_answers a ON a.id = v.answer_id WHERE a.question_id = NEW.question_id
  ) participants ON participants.user_id = p.user_id
  WHERE p.user_id <> NEW.user_id AND p.user_id <> question_record.user_id AND p.deletion_requested_at IS NULL;
  RETURN NEW;
END $$;