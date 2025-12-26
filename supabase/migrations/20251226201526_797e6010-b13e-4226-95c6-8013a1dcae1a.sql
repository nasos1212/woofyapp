-- Add plan_type to memberships
ALTER TABLE public.memberships 
ADD COLUMN plan_type text NOT NULL DEFAULT 'single',
ADD COLUMN share_code text UNIQUE,
ADD COLUMN max_pets integer NOT NULL DEFAULT 1;

-- Create pets table for multiple pets
CREATE TABLE public.pets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  pet_name text NOT NULL,
  pet_breed text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create membership_shares table for family sharing
CREATE TABLE public.membership_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(membership_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_shares ENABLE ROW LEVEL SECURITY;

-- Pets policies: owners and shared members can view/manage
CREATE POLICY "Users can view pets on their membership"
ON public.pets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships WHERE id = pets.membership_id AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM membership_shares WHERE membership_id = pets.membership_id AND shared_with_user_id = auth.uid()
  )
  OR owner_user_id = auth.uid()
);

CREATE POLICY "Users can insert pets on their membership"
ON public.pets FOR INSERT
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM memberships WHERE id = pets.membership_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM membership_shares WHERE membership_id = pets.membership_id AND shared_with_user_id = auth.uid()
    )
  )
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update their own pets"
ON public.pets FOR UPDATE
USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own pets"
ON public.pets FOR DELETE
USING (owner_user_id = auth.uid());

-- Membership shares policies
CREATE POLICY "Membership owners can view shares"
ON public.membership_shares FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships WHERE id = membership_shares.membership_id AND user_id = auth.uid()
  )
  OR shared_with_user_id = auth.uid()
);

CREATE POLICY "Shared users can insert themselves"
ON public.membership_shares FOR INSERT
WITH CHECK (shared_with_user_id = auth.uid());

CREATE POLICY "Membership owners can delete shares"
ON public.membership_shares FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM memberships WHERE id = membership_shares.membership_id AND user_id = auth.uid()
  )
);

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := 'FAM-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
  RETURN new_code;
END;
$$;

-- Update memberships policy to allow shared users to view
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;

CREATE POLICY "Users can view their membership or shared membership"
ON public.memberships FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM membership_shares WHERE membership_id = id AND shared_with_user_id = auth.uid()
  )
);