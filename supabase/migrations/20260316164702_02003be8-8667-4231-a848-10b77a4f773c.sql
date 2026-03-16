
-- Add categories array column to businesses table
ALTER TABLE public.businesses ADD COLUMN categories text[] DEFAULT '{}';

-- Populate categories from existing category column
UPDATE public.businesses SET categories = ARRAY[category::text] WHERE category IS NOT NULL;

-- Create trigger to keep category and categories in sync
CREATE OR REPLACE FUNCTION sync_business_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- When categories is updated, set category to the first element
  IF NEW.categories IS NOT NULL AND array_length(NEW.categories, 1) > 0 THEN
    NEW.category = NEW.categories[1]::business_category;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_business_categories
  BEFORE INSERT OR UPDATE OF categories ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_categories();
