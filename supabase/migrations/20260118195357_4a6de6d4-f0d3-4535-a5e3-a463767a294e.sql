-- Add birthday_locked column to pets table
-- This will be TRUE when either:
-- 1. 14 days have passed since pet creation, OR
-- 2. A birthday offer has been received

ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS birthday_locked boolean DEFAULT false;

-- Create a function to check if birthday can be edited
CREATE OR REPLACE FUNCTION public.can_edit_pet_birthday(_pet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- If pet doesn't exist, return false
      WHEN NOT EXISTS (SELECT 1 FROM pets WHERE id = _pet_id) THEN false
      -- If already locked, cannot edit
      WHEN (SELECT birthday_locked FROM pets WHERE id = _pet_id) THEN false
      -- If a birthday offer has been sent for this pet, cannot edit
      WHEN EXISTS (SELECT 1 FROM sent_birthday_offers WHERE pet_id = _pet_id) THEN false
      -- If more than 14 days since creation, cannot edit
      WHEN (SELECT created_at FROM pets WHERE id = _pet_id) < NOW() - INTERVAL '14 days' THEN false
      -- Otherwise can edit
      ELSE true
    END
$$;

-- Create a trigger function to auto-lock birthday after receiving an offer
CREATE OR REPLACE FUNCTION public.lock_birthday_after_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a birthday offer is sent, lock the pet's birthday
  UPDATE public.pets 
  SET birthday_locked = true 
  WHERE id = NEW.pet_id AND birthday_locked = false;
  
  RETURN NEW;
END;
$$;

-- Create trigger on sent_birthday_offers
DROP TRIGGER IF EXISTS trigger_lock_birthday_after_offer ON public.sent_birthday_offers;
CREATE TRIGGER trigger_lock_birthday_after_offer
AFTER INSERT ON public.sent_birthday_offers
FOR EACH ROW
EXECUTE FUNCTION public.lock_birthday_after_offer();

-- Create a trigger to prevent birthday changes when locked or conditions met
CREATE OR REPLACE FUNCTION public.prevent_birthday_change_if_locked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If birthday is being changed
  IF OLD.birthday IS DISTINCT FROM NEW.birthday THEN
    -- Check if birthday is locked
    IF OLD.birthday_locked = true THEN
      RAISE EXCEPTION 'Birthday cannot be changed - it has been locked';
    END IF;
    
    -- Check if a birthday offer has been received
    IF EXISTS (SELECT 1 FROM sent_birthday_offers WHERE pet_id = OLD.id) THEN
      NEW.birthday_locked := true;
      RAISE EXCEPTION 'Birthday cannot be changed - a birthday offer has already been received';
    END IF;
    
    -- Check if more than 14 days since pet was added
    IF OLD.created_at < NOW() - INTERVAL '14 days' THEN
      NEW.birthday_locked := true;
      RAISE EXCEPTION 'Birthday cannot be changed - the 14-day edit window has passed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_birthday_change ON public.pets;
CREATE TRIGGER trigger_prevent_birthday_change
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.prevent_birthday_change_if_locked();