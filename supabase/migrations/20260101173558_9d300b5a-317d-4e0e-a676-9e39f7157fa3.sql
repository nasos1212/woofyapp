-- Add birthday to pets table
ALTER TABLE public.pets ADD COLUMN birthday DATE;

-- Create a view for businesses to see their customers' pet birthdays
-- Based on offer redemptions (interactions)
CREATE VIEW public.business_customer_pets AS
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

-- Create notifications table entry type for birthday reminders
-- We'll use the existing notifications table

-- Create a table to store business birthday notification preferences
CREATE TABLE public.business_birthday_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  days_before_reminder INTEGER NOT NULL DEFAULT 7,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- Enable RLS
ALTER TABLE public.business_birthday_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can view their settings"
  ON public.business_birthday_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = business_birthday_settings.business_id 
    AND businesses.user_id = auth.uid()
  ));

CREATE POLICY "Business owners can insert their settings"
  ON public.business_birthday_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = business_birthday_settings.business_id 
    AND businesses.user_id = auth.uid()
  ));

CREATE POLICY "Business owners can update their settings"
  ON public.business_birthday_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = business_birthday_settings.business_id 
    AND businesses.user_id = auth.uid()
  ));