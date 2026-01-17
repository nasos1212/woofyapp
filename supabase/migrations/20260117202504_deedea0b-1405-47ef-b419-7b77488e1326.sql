-- Create verification status type if not exists (reusing existing)
-- Note: verification_status enum already exists with 'pending', 'approved', 'rejected'

-- Create shelters table
CREATE TABLE public.shelters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shelter_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  city TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  cover_photo_url TEXT,
  description TEXT,
  mission_statement TEXT,
  dogs_in_care TEXT,
  years_operating TEXT,
  dogs_helped_count INTEGER DEFAULT 0,
  facebook_url TEXT,
  instagram_url TEXT,
  donation_link TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shelters
-- Anyone can view approved shelters
CREATE POLICY "Anyone can view approved shelters"
ON public.shelters FOR SELECT
USING (verification_status = 'approved');

-- Admins can view all shelters
CREATE POLICY "Admins can view all shelters"
ON public.shelters FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Anyone can insert shelter applications (no auth required for applying)
CREATE POLICY "Anyone can submit shelter application"
ON public.shelters FOR INSERT
WITH CHECK (true);

-- Shelter owners can update their own shelter
CREATE POLICY "Shelter owners can update their shelter"
ON public.shelters FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any shelter
CREATE POLICY "Admins can update any shelter"
ON public.shelters FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create shelter photos table
CREATE TABLE public.shelter_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelter_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shelter_photos
CREATE POLICY "Anyone can view photos of approved shelters"
ON public.shelter_photos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shelters 
  WHERE shelters.id = shelter_photos.shelter_id 
  AND shelters.verification_status = 'approved'
));

CREATE POLICY "Admins can view all shelter photos"
ON public.shelter_photos FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Shelter owners can manage their photos"
ON public.shelter_photos FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shelters 
  WHERE shelters.id = shelter_photos.shelter_id 
  AND shelters.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shelters 
  WHERE shelters.id = shelter_photos.shelter_id 
  AND shelters.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all shelter photos"
ON public.shelter_photos FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_shelters_updated_at
BEFORE UPDATE ON public.shelters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();