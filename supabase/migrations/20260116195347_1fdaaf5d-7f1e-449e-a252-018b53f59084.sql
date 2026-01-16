-- Add pet_type column to offers table (null = all pets, 'dog' = dogs only, 'cat' = cats only)
ALTER TABLE public.offers 
ADD COLUMN pet_type text DEFAULT NULL;

-- Add check constraint for valid pet types
ALTER TABLE public.offers 
ADD CONSTRAINT offers_pet_type_check CHECK (pet_type IS NULL OR pet_type IN ('dog', 'cat'));

-- Create index for pet_type filtering
CREATE INDEX idx_offers_pet_type ON public.offers(pet_type);