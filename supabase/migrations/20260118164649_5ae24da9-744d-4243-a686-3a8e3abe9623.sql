-- Create a table for business locations (multiple stores per business)
CREATE TABLE public.business_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  google_maps_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- Businesses can view their own locations
CREATE POLICY "Users can view their own business locations"
  ON public.business_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = business_locations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Businesses can insert their own locations
CREATE POLICY "Users can insert their own business locations"
  ON public.business_locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = business_locations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Businesses can update their own locations
CREATE POLICY "Users can update their own business locations"
  ON public.business_locations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = business_locations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Businesses can delete their own locations
CREATE POLICY "Users can delete their own business locations"
  ON public.business_locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = business_locations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Public can view locations of approved businesses
CREATE POLICY "Public can view approved business locations"
  ON public.business_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = business_locations.business_id 
      AND businesses.verification_status = 'approved'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_business_locations_business_id ON public.business_locations(business_id);