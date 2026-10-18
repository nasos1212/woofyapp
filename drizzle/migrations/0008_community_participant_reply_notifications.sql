CREATE OR REPLACE FUNCTION public.notify_followers_on_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  question_record RECORD;
BEGIN
  SELECT id, title, user_id INTO question_record
  FROM public.community_questions WHERE id = NEW.question_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT p.user_id, 'community_follow_activity',
    CASE WHEN p.preferred_language = 'el' THEN 'Νέα απάντηση σε ερώτηση που σας ενδιαφέρει'
         ELSE 'New reply to a question you engaged with' END,
    question_record.title,
    jsonb_build_object('question_id', question_record.id, 'answer_id', NEW.id)
  FROM public.profiles p
  JOIN (
    SELECT user_id FROM public.community_question_followers WHERE question_id = NEW.question_id
    UNION
    SELECT user_id FROM public.community_saved_questions WHERE question_id = NEW.question_id
    UNION
    SELECT user_id FROM public.community_helped WHERE question_id = NEW.question_id
    UNION
    SELECT user_id FROM public.community_answers WHERE question_id = NEW.question_id
    UNION
    SELECT v.user_id FROM public.community_votes v
    JOIN public.community_answers a ON a.id = v.answer_id
    WHERE a.question_id = NEW.question_id
  ) participants ON participants.user_id = p.user_id
  WHERE p.user_id <> NEW.user_id
    AND p.user_id <> question_record.user_id
    AND p.deletion_requested_at IS NULL;

  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.notify_followers_on_answer() IS 'Notifies unique savers, followers, answerers, answer voters and helpful-markers of replies on that question. Excludes reply author and question owner (notified separately). No unrelated new-question broadcast.';