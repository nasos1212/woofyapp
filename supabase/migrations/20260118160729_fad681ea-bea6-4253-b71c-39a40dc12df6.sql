-- Create table for adoption inquiries
CREATE TABLE public.adoption_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.shelter_adoptable_pets(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  inquirer_name TEXT NOT NULL,
  inquirer_email TEXT NOT NULL,
  inquirer_phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.adoption_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit an inquiry (public form)
CREATE POLICY "Anyone can submit adoption inquiries"
ON public.adoption_inquiries
FOR INSERT
WITH CHECK (true);

-- Policy: Shelter owners can view and manage inquiries for their shelter
CREATE POLICY "Shelter owners can view their inquiries"
ON public.adoption_inquiries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Shelter owners can update their inquiries"
ON public.adoption_inquiries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Shelter owners can delete their inquiries"
ON public.adoption_inquiries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_adoption_inquiries_updated_at
BEFORE UPDATE ON public.adoption_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_adoption_inquiries_shelter_id ON public.adoption_inquiries(shelter_id);
CREATE INDEX idx_adoption_inquiries_pet_id ON public.adoption_inquiries(pet_id);
CREATE INDEX idx_adoption_inquiries_status ON public.adoption_inquiries(status);

-- Create table for multiple pet photos
CREATE TABLE public.shelter_adoptable_pet_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.shelter_adoptable_pets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelter_adoptable_pet_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view photos of available pets from approved shelters
CREATE POLICY "Anyone can view pet photos from approved shelters"
ON public.shelter_adoptable_pet_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shelter_adoptable_pets sap
    JOIN public.shelters s ON s.id = sap.shelter_id
    WHERE sap.id = pet_id 
    AND sap.is_available = true
    AND s.verification_status = 'approved'
  )
);

-- Policy: Shelter owners can manage photos for their pets
CREATE POLICY "Shelter owners can manage their pet photos"
ON public.shelter_adoptable_pet_photos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shelter_adoptable_pets sap
    JOIN public.shelters s ON s.id = sap.shelter_id
    WHERE sap.id = pet_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shelter_adoptable_pets sap
    JOIN public.shelters s ON s.id = sap.shelter_id
    WHERE sap.id = pet_id 
    AND s.user_id = auth.uid()
  )
);

-- Create index
CREATE INDEX idx_shelter_adoptable_pet_photos_pet_id ON public.shelter_adoptable_pet_photos(pet_id);