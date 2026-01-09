-- Fix function search_path for generate_member_number
CREATE OR REPLACE FUNCTION public.generate_member_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'WF-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN new_number;
END;
$function$;