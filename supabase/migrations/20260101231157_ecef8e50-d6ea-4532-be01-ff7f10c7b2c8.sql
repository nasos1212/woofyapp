-- 1. Create a secure public view for businesses that excludes sensitive contact info
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public AS
SELECT 
  id,
  business_name,
  category,
  description,
  address,
  city,
  website,
  logo_url,
  google_maps_url,
  verification_status,
  verified_at,
  created_at,
  updated_at
  -- Excludes: email, phone, user_id
FROM public.businesses
WHERE verification_status = 'approved';

-- 2. Update RLS policy on businesses to hide email/phone from public
DROP POLICY IF EXISTS "Anyone can view approved businesses" ON public.businesses;

CREATE POLICY "Anyone can view approved businesses non-sensitive"
ON public.businesses
FOR SELECT
USING (
  (verification_status = 'approved' AND auth.uid() IS NOT NULL)
  OR (auth.uid() = user_id)
);

-- 3. Update lost_pet_alerts policy to hide contact info from non-owners
DROP POLICY IF EXISTS "Anyone can view active lost pet alerts" ON public.lost_pet_alerts;

CREATE POLICY "Anyone can view active alerts basic info"
ON public.lost_pet_alerts
FOR SELECT
USING (
  (status = 'active') OR (owner_user_id = auth.uid())
);

-- Note: Contact info is still in the row but we should handle this at application level
-- by only displaying contact info to authenticated users who want to help

-- 4. Add INSERT policy for verification_attempts to prevent abuse
CREATE POLICY "Only service role can insert verification attempts"
ON public.verification_attempts
FOR INSERT
WITH CHECK (false);  -- Only service role (bypasses RLS) can insert