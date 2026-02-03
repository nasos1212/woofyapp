-- Create table for pet-friendly place ratings
CREATE TABLE public.pet_friendly_place_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.pet_friendly_places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(place_id, user_id)
);

-- Enable RLS
ALTER TABLE public.pet_friendly_place_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Anyone can view ratings"
ON public.pet_friendly_place_ratings
FOR SELECT
USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can rate places"
ON public.pet_friendly_place_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their ratings"
ON public.pet_friendly_place_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their ratings"
ON public.pet_friendly_place_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION public.update_place_average_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  -- Calculate average for the place
  SELECT AVG(rating)::NUMERIC(2,1) INTO avg_rating
  FROM pet_friendly_place_ratings
  WHERE place_id = COALESCE(NEW.place_id, OLD.place_id);
  
  -- Update the place's rating
  UPDATE pet_friendly_places
  SET rating = avg_rating
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update average on insert/update/delete
CREATE TRIGGER update_place_rating_on_change
AFTER INSERT OR UPDATE OR DELETE ON public.pet_friendly_place_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_place_average_rating();