
-- 1. Anonymous flag on answers
ALTER TABLE public.community_answers
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- 2. Stable per-user pseudonym on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS anonymous_handle text;

-- Backfill existing profiles with deterministic handle
UPDATE public.profiles
SET anonymous_handle = 'Anonymous Dog Owner #' || ((abs(hashtextextended(user_id::text, 0)) % 9000) + 1000)::text
WHERE anonymous_handle IS NULL;

-- Trigger to assign handle on new profile
CREATE OR REPLACE FUNCTION public.set_anonymous_handle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.anonymous_handle IS NULL THEN
    NEW.anonymous_handle := 'Anonymous Dog Owner #' || ((abs(hashtextextended(NEW.user_id::text, 0)) % 9000) + 1000)::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_anonymous_handle_trigger ON public.profiles;
CREATE TRIGGER set_anonymous_handle_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_anonymous_handle();

-- 3. Update profiles_public to expose anonymous_handle (safe — pseudonym)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id,
  full_name,
  avatar_url,
  preferred_city,
  anonymous_handle
FROM public.profiles;

REVOKE ALL ON public.profiles_public FROM anon, authenticated, service_role;
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT ALL ON public.profiles_public TO service_role;

-- 4. Rebuild community_answers_public to mask identity for anonymous answers
DROP VIEW IF EXISTS public.community_answers_public;
CREATE VIEW public.community_answers_public
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.question_id,
  a.content,
  a.is_accepted,
  -- Hide professional badge when posting anonymously
  CASE WHEN a.is_anonymous THEN false ELSE a.is_verified_pro END AS is_verified_pro,
  a.is_anonymous,
  a.upvotes,
  a.downvotes,
  a.created_at,
  a.updated_at,
  CASE WHEN a.is_anonymous THEN p.anonymous_handle ELSE p.full_name END AS author_name,
  CASE WHEN a.is_anonymous THEN NULL ELSE p.avatar_url END AS author_avatar_url,
  CASE WHEN a.is_anonymous THEN false ELSE COALESCE(e.is_verified_professional, false) END AS author_is_verified_professional,
  CASE WHEN a.is_anonymous THEN NULL ELSE e.professional_title END AS author_professional_title
FROM public.community_answers a
LEFT JOIN public.profiles p ON p.user_id = a.user_id
LEFT JOIN public.community_expert_stats e ON e.user_id = a.user_id;

REVOKE ALL ON public.community_answers_public FROM anon, authenticated, service_role;
GRANT SELECT ON public.community_answers_public TO authenticated;
GRANT ALL ON public.community_answers_public TO service_role;
