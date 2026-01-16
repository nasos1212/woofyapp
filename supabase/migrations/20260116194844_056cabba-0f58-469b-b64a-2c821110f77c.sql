-- Add pet_type column to pets table
ALTER TABLE public.pets 
ADD COLUMN pet_type text NOT NULL DEFAULT 'dog';

-- Add check constraint for valid pet types
ALTER TABLE public.pets 
ADD CONSTRAINT pets_pet_type_check CHECK (pet_type IN ('dog', 'cat'));

-- Create index for pet_type queries
CREATE INDEX idx_pets_pet_type ON public.pets(pet_type);