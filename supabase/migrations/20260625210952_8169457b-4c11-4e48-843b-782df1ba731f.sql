
-- 1. business_reviews: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view reviews of approved businesses" ON public.business_reviews;
CREATE POLICY "Authenticated users can view reviews of approved businesses"
ON public.business_reviews
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = business_reviews.business_id
    AND businesses.verification_status = 'approved'::verification_status
));

-- 2. businesses: drop broad SELECT policy; rely on businesses_public view for non-owners
DROP POLICY IF EXISTS "Anyone can view approved businesses non-sensitive" ON public.businesses;
CREATE POLICY "Owners can view their own business"
ON public.businesses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
-- Switch view to security definer so it can be read without table SELECT privilege
ALTER VIEW public.businesses_public SET (security_invoker=off);
GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- 3. shelters: drop public SELECT; create public view excluding PII
DROP POLICY IF EXISTS "Anyone can view approved non-hidden shelters" ON public.shelters;

CREATE OR REPLACE VIEW public.shelters_public
WITH (security_invoker=off) AS
SELECT
  s.id, s.user_id, s.shelter_name, s.location, s.city,
  s.description, s.mission_statement,
  s.logo_url, s.cover_photo_url, s.cover_photo_position,
  s.website, s.donation_link, s.dogs_in_care,
  s.facebook_url, s.instagram_url, s.tiktok_url,
  s.verification_status, s.is_hidden, s.verified_at,
  s.created_at, s.updated_at
FROM public.shelters s
WHERE s.verification_status = 'approved'::verification_status
  AND s.is_hidden = false;

GRANT SELECT ON public.shelters_public TO anon, authenticated;

-- 4. pet_friendly_place_ratings: restrict row reads; expose rater-less view
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.pet_friendly_place_ratings;

CREATE POLICY "Users can view their own ratings"
ON public.pet_friendly_place_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings"
ON public.pet_friendly_place_ratings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.pet_friendly_place_ratings_public
WITH (security_invoker=off) AS
SELECT
  r.id, r.place_id, r.rating, r.review_text,
  r.photo_url, r.photo_url_2,
  r.created_at, r.updated_at,
  p.full_name AS reviewer_name
FROM public.pet_friendly_place_ratings r
LEFT JOIN public.profiles p ON p.user_id = r.user_id;

GRANT SELECT ON public.pet_friendly_place_ratings_public TO anon, authenticated;

-- 5. community_answers: restrict row reads; expose user_id-less view with author display
DROP POLICY IF EXISTS "Authenticated users can view answers" ON public.community_answers;

CREATE POLICY "Authors can view their own answers"
ON public.community_answers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all answers"
ON public.community_answers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Question owners can view answers to their questions"
ON public.community_answers
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.community_questions q
  WHERE q.id = community_answers.question_id
    AND q.user_id = auth.uid()
));

CREATE OR REPLACE VIEW public.community_answers_public
WITH (security_invoker=off) AS
SELECT
  a.id, a.question_id, a.content,
  a.is_accepted, a.is_verified_pro,
  a.upvotes, a.downvotes,
  a.created_at, a.updated_at,
  p.full_name AS author_name,
  p.avatar_url AS author_avatar_url,
  e.is_verified_professional AS author_is_verified_professional,
  e.professional_title AS author_professional_title
FROM public.community_answers a
LEFT JOIN public.profiles p ON p.user_id = a.user_id
LEFT JOIN public.community_expert_stats e ON e.user_id = a.user_id;

GRANT SELECT ON public.community_answers_public TO authenticated;

-- 6. realtime support-unread-count: tighten so users can only subscribe to their own channel
DROP POLICY IF EXISTS "Support topics: owner or admin can read" ON realtime.messages;

CREATE POLICY "Support topics: owner or admin can read"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'admin-support-%' THEN
      has_role(auth.uid(), 'admin'::app_role)
    WHEN realtime.topic() LIKE 'support-unread-count%' THEN
      has_role(auth.uid(), 'admin'::app_role)
      OR realtime.topic() = ('support-unread-count-' || auth.uid()::text)
    WHEN realtime.topic() LIKE 'support-messages-%'
      OR realtime.topic() LIKE 'support-conversation-%' THEN
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.support_conversations sc
        WHERE sc.user_id = auth.uid()
          AND (realtime.topic() = ('support-messages-' || sc.id::text)
               OR realtime.topic() = ('support-conversation-' || sc.id::text))
      )
    ELSE true
  END
);
