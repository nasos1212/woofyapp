ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_answers ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_reports ADD COLUMN IF NOT EXISTS answer_id uuid REFERENCES public.community_answers(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_community_reports_answer_id ON public.community_reports(answer_id);

CREATE UNIQUE INDEX IF NOT EXISTS community_reports_unique_question ON public.community_reports(reporter_user_id, question_id) WHERE answer_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_reports_unique_answer ON public.community_reports(reporter_user_id, answer_id) WHERE answer_id IS NOT NULL;

CREATE POLICY "Admins can update any answer" ON public.community_answers FOR UPDATE
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete any answer" ON public.community_answers FOR DELETE
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete reports" ON public.community_reports FOR DELETE
  USING (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_community_hidden_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
     AND current_user NOT IN ('postgres','service_role','supabase_admin')
     AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.is_hidden := OLD.is_hidden;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_question_hidden BEFORE UPDATE ON public.community_questions
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_hidden_flag();
CREATE TRIGGER protect_answer_hidden BEFORE UPDATE ON public.community_answers
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_hidden_flag();

CREATE OR REPLACE FUNCTION public.protect_community_hidden_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN NEW.is_hidden := false; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_question_hidden_insert BEFORE INSERT ON public.community_questions
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_hidden_insert();
CREATE TRIGGER protect_answer_hidden_insert BEFORE INSERT ON public.community_answers
  FOR EACH ROW EXECUTE FUNCTION public.protect_community_hidden_insert();

CREATE OR REPLACE FUNCTION public.auto_hide_reported_community_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NEW.answer_id IS NOT NULL THEN
    SELECT count(DISTINCT reporter_user_id) INTO n FROM community_reports
      WHERE answer_id = NEW.answer_id AND status = 'pending';
    IF n >= 2 THEN UPDATE community_answers SET is_hidden = true WHERE id = NEW.answer_id; END IF;
  ELSE
    SELECT count(DISTINCT reporter_user_id) INTO n FROM community_reports
      WHERE question_id = NEW.question_id AND answer_id IS NULL AND status = 'pending';
    IF n >= 2 THEN UPDATE community_questions SET is_hidden = true WHERE id = NEW.question_id; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.auto_hide_reported_community_content() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER auto_hide_reported_content AFTER INSERT ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_hide_reported_community_content();

DROP VIEW IF EXISTS public.community_answers_public;
DROP VIEW IF EXISTS public.community_questions_public;
DROP FUNCTION IF EXISTS public.community_answer_display();
DROP FUNCTION IF EXISTS public.community_question_display();

CREATE FUNCTION public.community_answer_display()
RETURNS TABLE(id uuid, question_id uuid, content text, is_accepted boolean, is_verified_pro boolean, is_anonymous boolean, upvotes integer, downvotes integer, created_at timestamptz, updated_at timestamptz, author_name text, author_avatar_url text, author_is_verified_professional boolean, author_professional_title text, is_mine boolean, is_hidden boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT a.id,a.question_id,a.content,a.is_accepted,
 CASE WHEN a.is_anonymous THEN false ELSE a.is_verified_pro END,
 a.is_anonymous,a.upvotes,a.downvotes,a.created_at,a.updated_at,
 CASE WHEN a.is_anonymous THEN p.anonymous_handle ELSE p.full_name END,
 CASE WHEN a.is_anonymous THEN NULL::text ELSE p.avatar_url END,
 CASE WHEN a.is_anonymous THEN false ELSE COALESCE(e.is_verified_professional,false) END,
 CASE WHEN a.is_anonymous THEN NULL::text ELSE e.professional_title END,
 a.user_id = auth.uid(),
 a.is_hidden
 FROM public.community_answers a
 JOIN public.community_questions q ON q.id=a.question_id
 LEFT JOIN public.profiles p ON p.user_id=a.user_id
 LEFT JOIN public.community_expert_stats e ON e.user_id=a.user_id
 WHERE auth.uid() IS NOT NULL
   AND (NOT a.is_hidden OR a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
$$;

CREATE FUNCTION public.community_question_display()
RETURNS TABLE(id uuid, user_id uuid, pet_id uuid, category_id uuid, title text, content text, urgency text, breed_tags text[], status text, is_pinned boolean, is_featured boolean, view_count integer, helped_count integer, created_at timestamptz, updated_at timestamptz, animal_type text, is_anonymous boolean, author_name text, author_avatar_url text, is_mine boolean, is_hidden boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT q.id,
  CASE WHEN q.is_anonymous AND q.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN NULL ELSE q.user_id END,
  CASE WHEN q.is_anonymous AND q.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN NULL ELSE q.pet_id END,
  q.category_id, q.title, q.content, q.urgency, q.breed_tags, q.status, q.is_pinned, q.is_featured,
  q.view_count, q.helped_count, q.created_at, q.updated_at, q.animal_type, q.is_anonymous,
  CASE WHEN q.is_anonymous THEN COALESCE(p.anonymous_handle,'Anonymous') ELSE p.full_name END,
  CASE WHEN q.is_anonymous THEN NULL ELSE p.avatar_url END,
  q.user_id = auth.uid(),
  q.is_hidden
 FROM public.community_questions q
 LEFT JOIN public.profiles p ON p.user_id = q.user_id
 WHERE auth.uid() IS NOT NULL
   AND (NOT q.is_hidden OR q.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
$$;

REVOKE EXECUTE ON FUNCTION public.community_answer_display() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.community_question_display() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_answer_display() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.community_question_display() TO authenticated, service_role;

CREATE VIEW public.community_answers_public WITH (security_invoker=on) AS SELECT * FROM public.community_answer_display();
CREATE VIEW public.community_questions_public WITH (security_invoker=on) AS SELECT * FROM public.community_question_display();
GRANT SELECT ON public.community_answers_public TO authenticated, service_role;
GRANT SELECT ON public.community_questions_public TO authenticated, service_role;