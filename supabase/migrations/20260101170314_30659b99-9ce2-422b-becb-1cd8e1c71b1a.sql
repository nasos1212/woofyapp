-- SECURITY FIX 1: Replace overly permissive notifications INSERT policy
-- Drop the dangerous policy that allows any user to create notifications for any user_id
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a function to securely create family invite notifications
-- This validates that the caller owns a family membership with the share code
CREATE OR REPLACE FUNCTION public.create_family_invite_notification(
  _invitee_user_id UUID,
  _share_code TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inviter_membership memberships;
  _inviter_profile profiles;
BEGIN
  -- Verify caller owns the membership with this share code and it's a family plan
  SELECT * INTO _inviter_membership
  FROM memberships
  WHERE user_id = auth.uid()
    AND share_code = _share_code
    AND plan_type = 'family';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid share code or not a family plan';
  END IF;
  
  -- Get inviter profile
  SELECT * INTO _inviter_profile
  FROM profiles
  WHERE user_id = auth.uid();
  
  -- Prevent inviting yourself
  IF _invitee_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;
  
  -- Check if invitee exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = _invitee_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    _invitee_user_id,
    'family_invite',
    'Family Pack Invitation',
    COALESCE(_inviter_profile.full_name, 'A member') || ' is inviting you to add your pets to their family pack!',
    jsonb_build_object('share_code', _share_code, 'inviter_name', COALESCE(_inviter_profile.full_name, 'A member'))
  );
END;
$$;

-- SECURITY FIX 2: Create a public view for businesses that excludes sensitive columns
-- This prevents exposure of email, phone, and user_id to unauthenticated/public users
CREATE OR REPLACE VIEW public.businesses_public AS
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
FROM businesses
WHERE verification_status = 'approved';

-- Grant access to the view for all users
GRANT SELECT ON public.businesses_public TO anon, authenticated;