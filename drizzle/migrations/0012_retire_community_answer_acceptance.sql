CREATE OR REPLACE FUNCTION public.retire_answer_acceptance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.is_accepted := false;
 RETURN NEW;
END $$;
CREATE TRIGGER retire_answer_acceptance BEFORE INSERT OR UPDATE OF is_accepted ON public.community_answers FOR EACH ROW EXECUTE FUNCTION public.retire_answer_acceptance();
CREATE OR REPLACE FUNCTION public.notify_answer_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 RETURN NEW;
END $$;
COMMENT ON COLUMN public.community_answers.is_accepted IS 'DEPRECATED: answer acceptance retired; retained for compatibility with older clients.';