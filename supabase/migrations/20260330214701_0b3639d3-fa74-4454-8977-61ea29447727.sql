-- Re-apply fixes that didn't persist
DROP POLICY IF EXISTS "Authenticated users can view limited profiles" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can insert redemptions via edge function" ON public.offer_redemptions;
CREATE POLICY "Only service role can insert redemptions" ON public.offer_redemptions
  FOR INSERT TO public
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.prevent_self_verify_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_verified_professional = true AND (OLD IS NULL OR OLD.is_verified_professional = false)) THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      NEW.is_verified_professional := false;
      NEW.professional_title := NULL;
      NEW.professional_credentials := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_professional_verification ON public.community_expert_stats;
CREATE TRIGGER enforce_professional_verification
  BEFORE INSERT OR UPDATE ON public.community_expert_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_verify_professional();