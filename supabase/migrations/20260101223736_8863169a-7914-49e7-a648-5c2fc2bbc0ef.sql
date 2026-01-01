-- 1. Favorite offers table
CREATE TABLE public.favorite_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

ALTER TABLE public.favorite_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
ON public.favorite_offers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" 
ON public.favorite_offers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" 
ON public.favorite_offers FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Rating prompts table (tracks when to show rating prompts)
CREATE TABLE public.rating_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  redemption_id UUID NOT NULL REFERENCES public.offer_redemptions(id) ON DELETE CASCADE,
  prompt_after TIMESTAMP WITH TIME ZONE NOT NULL,
  prompted_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(redemption_id)
);

ALTER TABLE public.rating_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompts" 
ON public.rating_prompts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
ON public.rating_prompts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" 
ON public.rating_prompts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code" 
ON public.referral_codes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their referral code" 
ON public.referral_codes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Referrals tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_given_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view if they were referred" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can insert referrals" 
ON public.referrals FOR INSERT 
WITH CHECK (auth.uid() = referred_user_id);

-- 5. User achievements/badges table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  name_prefix TEXT;
  new_code TEXT;
BEGIN
  name_prefix := UPPER(COALESCE(SUBSTRING(REGEXP_REPLACE(user_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 4), 'PAWS'));
  IF LENGTH(name_prefix) < 4 THEN
    name_prefix := name_prefix || REPEAT('X', 4 - LENGTH(name_prefix));
  END IF;
  new_code := name_prefix || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  RETURN new_code;
END;
$$;