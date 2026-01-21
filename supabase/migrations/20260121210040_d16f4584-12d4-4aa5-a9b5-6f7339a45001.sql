-- Add animal_type column to community_questions
ALTER TABLE public.community_questions 
ADD COLUMN animal_type TEXT DEFAULT 'dog' CHECK (animal_type IN ('dog', 'cat'));

-- Update existing category names to be more generic (pet-inclusive)
UPDATE public.community_categories SET name = 'Puppies & Kittens', slug = 'puppies-kittens', description = 'Questions about raising puppies, kittens, and welcoming new pets' WHERE slug = 'puppies-new-dogs';

UPDATE public.community_categories SET name = 'Senior Pets', slug = 'senior-pets', description = 'Care for aging dogs, cats, and senior-specific concerns' WHERE slug = 'senior-dogs';