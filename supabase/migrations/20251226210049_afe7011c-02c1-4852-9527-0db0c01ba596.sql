-- Create business_photos table for business gallery
CREATE TABLE public.business_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos of approved businesses
CREATE POLICY "Anyone can view photos of approved businesses"
ON public.business_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.verification_status = 'approved'
  )
);

-- Business owners can manage their photos
CREATE POLICY "Business owners can insert photos"
ON public.business_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update their photos"
ON public.business_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete their photos"
ON public.business_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.user_id = auth.uid()
  )
);

-- Create business_reviews table
CREATE TABLE public.business_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews of approved businesses
CREATE POLICY "Anyone can view reviews of approved businesses"
ON public.business_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_reviews.business_id
    AND businesses.verification_status = 'approved'
  )
);

-- Authenticated users can insert reviews
CREATE POLICY "Users can insert their own reviews"
ON public.business_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.business_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.business_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Add google_maps_url to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Create trigger for updated_at on reviews
CREATE TRIGGER update_business_reviews_updated_at
BEFORE UPDATE ON public.business_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();