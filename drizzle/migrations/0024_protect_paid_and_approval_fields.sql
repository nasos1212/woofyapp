CREATE OR REPLACE FUNCTION public.is_privileged_caller() RETURNS boolean
LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT current_user IN ('postgres','service_role','supabase_admin') OR public.has_role(auth.uid(),'admin')
$$;

CREATE OR REPLACE FUNCTION public.protect_membership_fields() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF public.is_privileged_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.plan_type := 'free'; NEW.max_pets := 5; NEW.is_active := true;
    NEW.expires_at := now() + interval '100 years';
  ELSE
    NEW.plan_type := OLD.plan_type; NEW.max_pets := OLD.max_pets; NEW.is_active := OLD.is_active;
    NEW.expires_at := OLD.expires_at; NEW.member_number := OLD.member_number; NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_membership_fields ON public.memberships;
CREATE TRIGGER protect_membership_fields BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.protect_membership_fields();

CREATE OR REPLACE FUNCTION public.protect_verification_fields() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF public.is_privileged_caller() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'pending'; NEW.verified_at := NULL;
  ELSE
    NEW.verification_status := OLD.verification_status; NEW.verified_at := OLD.verified_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_business_verification ON public.businesses;
CREATE TRIGGER protect_business_verification BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.protect_verification_fields();
DROP TRIGGER IF EXISTS protect_shelter_verification ON public.shelters;
CREATE TRIGGER protect_shelter_verification BEFORE INSERT OR UPDATE ON public.shelters
FOR EACH ROW EXECUTE FUNCTION public.protect_verification_fields();

CREATE OR REPLACE FUNCTION public.community_expert_stats_display()
RETURNS TABLE(id uuid, user_id uuid, total_answers integer, accepted_answers integer, total_upvotes integer, reputation_score integer, expertise_areas text[], is_verified_professional boolean, professional_title text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT s.id, s.user_id, s.total_answers, s.accepted_answers, s.total_upvotes, s.reputation_score,
         s.expertise_areas::text[], s.is_verified_professional, s.professional_title, s.updated_at
  FROM public.community_expert_stats s WHERE auth.uid() IS NOT NULL
$$;
REVOKE EXECUTE ON FUNCTION public.community_expert_stats_display() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.community_expert_stats_display() TO authenticated;
CREATE OR REPLACE VIEW public.community_expert_stats_public WITH (security_invoker = true) AS
  SELECT * FROM public.community_expert_stats_display();
GRANT SELECT ON public.community_expert_stats_public TO authenticated;

DROP POLICY IF EXISTS "Anyone can view expert stats" ON public.community_expert_stats;
CREATE POLICY "Users view own expert stats or admins" ON public.community_expert_stats
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));