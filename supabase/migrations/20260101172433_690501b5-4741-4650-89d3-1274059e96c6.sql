-- ===============================================
-- PAWPASS FEATURE EXPANSION: Health Records, Lost Pet Alerts, Pet Map
-- ===============================================

-- 1. PET HEALTH RECORDS TABLE
-- Stores vaccination records, vet visits, medications with reminders
CREATE TABLE public.pet_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('vaccination', 'vet_visit', 'medication', 'allergy', 'surgery', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  date_administered DATE,
  next_due_date DATE,
  veterinarian_name TEXT,
  clinic_name TEXT,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_health_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own pet health records
CREATE POLICY "Users can view their pet health records"
  ON public.pet_health_records FOR SELECT
  USING (owner_user_id = auth.uid());

-- Users can insert health records for their own pets
CREATE POLICY "Users can insert their pet health records"
  ON public.pet_health_records FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Users can update their own pet health records
CREATE POLICY "Users can update their pet health records"
  ON public.pet_health_records FOR UPDATE
  USING (owner_user_id = auth.uid());

-- Users can delete their own pet health records
CREATE POLICY "Users can delete their pet health records"
  ON public.pet_health_records FOR DELETE
  USING (owner_user_id = auth.uid());

-- 2. LOST PET ALERTS TABLE
-- Community-powered lost pet alert system
CREATE TABLE public.lost_pet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'found', 'resolved')),
  pet_name TEXT NOT NULL,
  pet_description TEXT NOT NULL,
  pet_breed TEXT,
  pet_photo_url TEXT,
  last_seen_location TEXT NOT NULL,
  last_seen_latitude DECIMAL(10, 8),
  last_seen_longitude DECIMAL(11, 8),
  last_seen_date TIMESTAMPTZ NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  reward_offered TEXT,
  additional_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.lost_pet_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active lost pet alerts (community feature)
CREATE POLICY "Anyone can view active lost pet alerts"
  ON public.lost_pet_alerts FOR SELECT
  USING (status = 'active' OR owner_user_id = auth.uid());

-- Users can create alerts for their own pets
CREATE POLICY "Users can create lost pet alerts"
  ON public.lost_pet_alerts FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Users can update their own alerts
CREATE POLICY "Users can update their lost pet alerts"
  ON public.lost_pet_alerts FOR UPDATE
  USING (owner_user_id = auth.uid());

-- Users can delete their own alerts
CREATE POLICY "Users can delete their lost pet alerts"
  ON public.lost_pet_alerts FOR DELETE
  USING (owner_user_id = auth.uid());

-- 3. LOST PET SIGHTINGS TABLE
-- Community sightings for lost pets
CREATE TABLE public.lost_pet_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.lost_pet_alerts(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL,
  sighting_location TEXT NOT NULL,
  sighting_latitude DECIMAL(10, 8),
  sighting_longitude DECIMAL(11, 8),
  sighting_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lost_pet_sightings ENABLE ROW LEVEL SECURITY;

-- Alert owners can view sightings for their alerts
CREATE POLICY "Alert owners can view sightings"
  ON public.lost_pet_sightings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_pet_alerts 
      WHERE id = alert_id AND owner_user_id = auth.uid()
    ) OR reporter_user_id = auth.uid()
  );

-- Any authenticated user can report sightings
CREATE POLICY "Users can report sightings"
  ON public.lost_pet_sightings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND reporter_user_id = auth.uid());

-- 4. PET-FRIENDLY PLACES TABLE
-- For the interactive map feature
CREATE TABLE public.pet_friendly_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  place_type TEXT NOT NULL CHECK (place_type IN ('dog_park', 'vet_clinic', 'emergency_vet', 'pet_store', 'groomer', 'cafe', 'beach', 'trail', 'other')),
  description TEXT,
  address TEXT,
  city TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  is_24_hour BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  rating DECIMAL(2, 1),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  added_by_user_id UUID,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_friendly_places ENABLE ROW LEVEL SECURITY;

-- Anyone can view pet-friendly places
CREATE POLICY "Anyone can view pet friendly places"
  ON public.pet_friendly_places FOR SELECT
  USING (true);

-- Authenticated users can add places
CREATE POLICY "Users can add pet friendly places"
  ON public.pet_friendly_places FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND added_by_user_id = auth.uid());

-- Users can update places they added (or admins)
CREATE POLICY "Users can update places they added"
  ON public.pet_friendly_places FOR UPDATE
  USING (added_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 5. AI CHAT HISTORY TABLE (for pet health assistant)
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat sessions"
  ON public.ai_chat_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create chat sessions"
  ON public.ai_chat_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their chat sessions"
  ON public.ai_chat_sessions FOR DELETE
  USING (user_id = auth.uid());

CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their sessions"
  ON public.ai_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their sessions"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Add updated_at trigger to new tables
CREATE TRIGGER update_pet_health_records_updated_at
  BEFORE UPDATE ON public.pet_health_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_pet_alerts_updated_at
  BEFORE UPDATE ON public.lost_pet_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_friendly_places_updated_at
  BEFORE UPDATE ON public.pet_friendly_places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();