-- Drop the security definer view and recreate as security invoker
DROP VIEW IF EXISTS public.business_customer_pets;

-- Recreate view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.business_customer_pets 
WITH (security_invoker = true)
AS
SELECT DISTINCT
  b.id as business_id,
  b.user_id as business_owner_id,
  b.business_name,
  p.id as pet_id,
  p.pet_name,
  p.pet_breed,
  p.birthday,
  p.owner_user_id as pet_owner_id,
  pr.full_name as owner_name,
  pr.email as owner_email,
  (SELECT MAX(redeemed_at) FROM offer_redemptions 
   WHERE business_id = b.id AND membership_id = m.id) as last_interaction
FROM offer_redemptions r
JOIN offers o ON o.id = r.offer_id
JOIN businesses b ON b.id = r.business_id
JOIN memberships m ON m.id = r.membership_id
JOIN pets p ON p.membership_id = m.id
JOIN profiles pr ON pr.user_id = p.owner_user_id
WHERE b.verification_status = 'approved';