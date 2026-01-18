
-- Update create_family_invite_notification to use Pack Leader naming
CREATE OR REPLACE FUNCTION public.create_family_invite_notification(_invitee_user_id uuid, _share_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _inviter_membership memberships;
  _inviter_profile profiles;
BEGIN
  -- Verify caller owns the membership with this share code and it's a Pack Leader plan
  SELECT * INTO _inviter_membership
  FROM memberships
  WHERE user_id = auth.uid()
    AND share_code = _share_code
    AND plan_type = 'family';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid share code or not a Pack Leader plan';
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
    'Pack Leader Invitation',
    COALESCE(_inviter_profile.full_name, 'A member') || ' is inviting you to add your pets to their Pack Leader membership!',
    jsonb_build_object('share_code', _share_code, 'inviter_name', COALESCE(_inviter_profile.full_name, 'A member'))
  );
END;
$function$;
