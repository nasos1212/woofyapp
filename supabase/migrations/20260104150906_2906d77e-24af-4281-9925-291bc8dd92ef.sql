-- Create promo_codes table for discount codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_membership')),
  discount_value NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT
);

-- Create promo_memberships table for influencer/free memberships
CREATE TABLE public.promo_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes - admins only
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for promo_memberships - admins can manage, users can view their own
CREATE POLICY "Admins can view all promo memberships"
  ON public.promo_memberships FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own promo membership"
  ON public.promo_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create promo memberships"
  ON public.promo_memberships FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo memberships"
  ON public.promo_memberships FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo memberships"
  ON public.promo_memberships FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Add admin policy to memberships table for admin management
CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all memberships"
  ON public.memberships FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));