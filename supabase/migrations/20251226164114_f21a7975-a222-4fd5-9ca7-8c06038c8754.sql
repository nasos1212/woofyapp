-- Fix function search path for generate_member_number
CREATE OR REPLACE FUNCTION public.generate_member_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'PP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN new_number;
END;
$$;