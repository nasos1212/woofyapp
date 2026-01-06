-- Function to notify question owner when someone answers their question
CREATE OR REPLACE FUNCTION public.notify_question_owner_on_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  answerer_name TEXT;
BEGIN
  -- Get the question details
  SELECT cq.id, cq.title, cq.user_id 
  INTO question_record
  FROM public.community_questions cq
  WHERE cq.id = NEW.question_id;
  
  -- Don't notify if the answerer is the question owner
  IF question_record.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get answerer's name
  SELECT COALESCE(p.full_name, p.email, 'Someone') 
  INTO answerer_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Create notification for question owner
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    question_record.user_id,
    'New Answer on Your Question',
    answerer_name || ' answered your question: "' || LEFT(question_record.title, 50) || CASE WHEN LENGTH(question_record.title) > 50 THEN '..."' ELSE '"' END,
    'community_answer',
    jsonb_build_object(
      'question_id', question_record.id,
      'answer_id', NEW.id,
      'answerer_user_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify followers when a question gets a new answer
CREATE OR REPLACE FUNCTION public.notify_followers_on_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  answerer_name TEXT;
  follower RECORD;
BEGIN
  -- Get the question details
  SELECT cq.id, cq.title, cq.user_id 
  INTO question_record
  FROM public.community_questions cq
  WHERE cq.id = NEW.question_id;
  
  -- Get answerer's name
  SELECT COALESCE(p.full_name, p.email, 'Someone') 
  INTO answerer_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Notify all followers except the answerer and the question owner
  FOR follower IN 
    SELECT user_id FROM public.community_question_followers 
    WHERE question_id = NEW.question_id 
    AND user_id != NEW.user_id 
    AND user_id != question_record.user_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES (
      follower.user_id,
      'New Activity on Followed Question',
      answerer_name || ' answered a question you follow: "' || LEFT(question_record.title, 50) || CASE WHEN LENGTH(question_record.title) > 50 THEN '..."' ELSE '"' END,
      'community_follow_activity',
      jsonb_build_object(
        'question_id', question_record.id,
        'answer_id', NEW.id,
        'answerer_user_id', NEW.user_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify question owner when their answer is accepted
CREATE OR REPLACE FUNCTION public.notify_answer_accepted()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  owner_name TEXT;
BEGIN
  -- Only proceed if is_accepted changed from false/null to true
  IF NEW.is_accepted = true AND (OLD.is_accepted IS NULL OR OLD.is_accepted = false) THEN
    -- Get the question details
    SELECT cq.id, cq.title, cq.user_id 
    INTO question_record
    FROM public.community_questions cq
    WHERE cq.id = NEW.question_id;
    
    -- Don't notify if the answerer is the question owner
    IF question_record.user_id = NEW.user_id THEN
      RETURN NEW;
    END IF;
    
    -- Get question owner's name
    SELECT COALESCE(p.full_name, p.email, 'Someone') 
    INTO owner_name
    FROM public.profiles p
    WHERE p.user_id = question_record.user_id;
    
    -- Create notification for the answerer
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES (
      NEW.user_id,
      'Your Answer Was Accepted! 🎉',
      owner_name || ' accepted your answer on: "' || LEFT(question_record.title, 50) || CASE WHEN LENGTH(question_record.title) > 50 THEN '..."' ELSE '"' END,
      'answer_accepted',
      jsonb_build_object(
        'question_id', question_record.id,
        'answer_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_community_answer_notify_owner ON public.community_answers;
CREATE TRIGGER on_community_answer_notify_owner
  AFTER INSERT ON public.community_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_question_owner_on_answer();

DROP TRIGGER IF EXISTS on_community_answer_notify_followers ON public.community_answers;
CREATE TRIGGER on_community_answer_notify_followers
  AFTER INSERT ON public.community_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_answer();

DROP TRIGGER IF EXISTS on_answer_accepted_notify ON public.community_answers;
CREATE TRIGGER on_answer_accepted_notify
  AFTER UPDATE ON public.community_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_answer_accepted();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;