CREATE OR REPLACE FUNCTION public.community_profile_display()
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, preferred_city text, anonymous_handle text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT p.user_id, p.full_name, p.avatar_url, p.preferred_city, p.anonymous_handle FROM public.profiles p WHERE auth.uid() IS NOT NULL $$;
REVOKE ALL ON FUNCTION public.community_profile_display() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_profile_display() TO authenticated, service_role;
CREATE OR REPLACE VIEW public.profiles_public WITH (security_invoker=on) AS SELECT * FROM public.community_profile_display();
GRANT SELECT ON public.profiles_public TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.community_answer_display()
RETURNS TABLE(id uuid, question_id uuid, content text, is_accepted boolean, is_verified_pro boolean, is_anonymous boolean, upvotes integer, downvotes integer, created_at timestamptz, updated_at timestamptz, author_name text, author_avatar_url text, author_is_verified_professional boolean, author_professional_title text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT a.id,a.question_id,a.content,a.is_accepted,
 CASE WHEN a.is_anonymous THEN false ELSE a.is_verified_pro END,
 a.is_anonymous,a.upvotes,a.downvotes,a.created_at,a.updated_at,
 CASE WHEN a.is_anonymous THEN p.anonymous_handle ELSE p.full_name END,
 CASE WHEN a.is_anonymous THEN NULL::text ELSE p.avatar_url END,
 CASE WHEN a.is_anonymous THEN false ELSE COALESCE(e.is_verified_professional,false) END,
 CASE WHEN a.is_anonymous THEN NULL::text ELSE e.professional_title END
 FROM public.community_answers a
 JOIN public.community_questions q ON q.id=a.question_id
 LEFT JOIN public.profiles p ON p.user_id=a.user_id
 LEFT JOIN public.community_expert_stats e ON e.user_id=a.user_id
 WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.community_answer_display() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_answer_display() TO authenticated, service_role;
CREATE OR REPLACE VIEW public.community_answers_public WITH (security_invoker=on) AS SELECT * FROM public.community_answer_display();
GRANT SELECT ON public.community_answers_public TO authenticated, service_role;