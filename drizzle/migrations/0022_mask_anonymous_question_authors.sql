CREATE OR REPLACE FUNCTION public.community_profile_display()
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text, preferred_city text, anonymous_handle text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT p.user_id, p.full_name, p.avatar_url, p.preferred_city,
  CASE WHEN p.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') THEN p.anonymous_handle ELSE NULL END
  FROM public.profiles p WHERE auth.uid() IS NOT NULL $$;

CREATE OR REPLACE FUNCTION public.community_question_display()
 RETURNS TABLE(id uuid, user_id uuid, pet_id uuid, category_id uuid, title text, content text, urgency text,
   breed_tags text[], status text, is_pinned boolean, is_featured boolean, view_count integer, helped_count integer,
   created_at timestamptz, updated_at timestamptz, animal_type text, is_anonymous boolean,
   author_name text, author_avatar_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
 SELECT q.id,
  CASE WHEN q.is_anonymous AND q.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN NULL ELSE q.user_id END,
  CASE WHEN q.is_anonymous AND q.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN NULL ELSE q.pet_id END,
  q.category_id, q.title, q.content, q.urgency, q.breed_tags, q.status, q.is_pinned, q.is_featured,
  q.view_count, q.helped_count, q.created_at, q.updated_at, q.animal_type, q.is_anonymous,
  CASE WHEN q.is_anonymous THEN COALESCE(p.anonymous_handle,'Anonymous') ELSE p.full_name END,
  CASE WHEN q.is_anonymous THEN NULL ELSE p.avatar_url END
 FROM public.community_questions q
 LEFT JOIN public.profiles p ON p.user_id = q.user_id
 WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.community_question_display() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_question_display() TO authenticated, service_role;

CREATE VIEW public.community_questions_public WITH (security_invoker = on) AS
 SELECT * FROM public.community_question_display();
REVOKE ALL ON public.community_questions_public FROM anon, authenticated;
GRANT SELECT ON public.community_questions_public TO authenticated;
GRANT ALL ON public.community_questions_public TO service_role;

DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.community_questions;
CREATE POLICY "Members can view non-anonymous or own questions" ON public.community_questions
 FOR SELECT TO authenticated USING (is_anonymous = false OR auth.uid() = user_id);