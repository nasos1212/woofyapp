-- Add is_hidden flag to businesses and shelters for excluding test accounts from public views and metrics
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_businesses_is_hidden ON public.businesses(is_hidden);
CREATE INDEX IF NOT EXISTS idx_shelters_is_hidden ON public.shelters(is_hidden);

-- Update public-facing SELECT policy on businesses to exclude hidden ones
DROP POLICY IF EXISTS "Anyone can view approved businesses non-sensitive" ON public.businesses;
CREATE POLICY "Anyone can view approved businesses non-sensitive"
ON public.businesses
FOR SELECT
USING (
  (
    verification_status = 'approved'::verification_status
    AND auth.uid() IS NOT NULL
    AND is_hidden = false
  )
  OR auth.uid() = user_id
);

-- Shelters table currently relies on existing policies; add filter to public read.
-- First, inspect & replace public shelter SELECT policy.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shelters' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shelters', pol.policyname);
  END LOOP;
END $$;

-- Recreate shelter SELECT policies
CREATE POLICY "Anyone can view approved non-hidden shelters"
ON public.shelters
FOR SELECT
USING (
  verification_status = 'approved'::verification_status
  AND is_hidden = false
);

CREATE POLICY "Owners can view their own shelter"
ON public.shelters
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shelters"
ON public.shelters
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));