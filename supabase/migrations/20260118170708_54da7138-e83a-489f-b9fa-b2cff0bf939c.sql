-- Create business_hours table
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Owners can manage their business hours
CREATE POLICY "Business owners can manage their hours"
ON public.business_hours
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_hours.business_id 
    AND businesses.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_hours.business_id 
    AND businesses.user_id = auth.uid()
  )
);

-- Public read access for approved businesses
CREATE POLICY "Anyone can view hours for approved businesses"
ON public.business_hours
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_hours.business_id 
    AND businesses.verification_status = 'approved'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();