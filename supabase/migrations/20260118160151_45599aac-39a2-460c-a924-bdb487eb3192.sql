-- Create table for shelter adoptable pets
CREATE TABLE public.shelter_adoptable_pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pet_type TEXT NOT NULL DEFAULT 'dog',
  breed TEXT,
  age TEXT,
  gender TEXT,
  description TEXT,
  photo_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelter_adoptable_pets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view available pets from approved shelters
CREATE POLICY "Anyone can view available pets from approved shelters"
ON public.shelter_adoptable_pets
FOR SELECT
USING (
  is_available = true 
  AND EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND verification_status = 'approved'
  )
);

-- Policy: Shelter owners can manage their own pets
CREATE POLICY "Shelter owners can manage their own pets"
ON public.shelter_adoptable_pets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE id = shelter_id 
    AND user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_shelter_adoptable_pets_updated_at
BEFORE UPDATE ON public.shelter_adoptable_pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_shelter_adoptable_pets_shelter_id ON public.shelter_adoptable_pets(shelter_id);
CREATE INDEX idx_shelter_adoptable_pets_is_available ON public.shelter_adoptable_pets(is_available);