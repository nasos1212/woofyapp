CREATE OR REPLACE FUNCTION public.public_city_businesses()
RETURNS TABLE(id uuid, business_name text, category public.business_category, categories text[], city text, logo_url text, description text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT b.id, b.business_name, b.category, b.categories::text[], c.city, b.logo_url, left(b.description, 220)
  FROM public.businesses b
  CROSS JOIN LATERAL (
    SELECT b.city AS city WHERE b.city IS NOT NULL
    UNION SELECT l.city FROM public.business_locations l WHERE l.business_id = b.id
  ) c
  WHERE b.verification_status = 'approved'::public.verification_status AND NOT b.is_hidden;
$$;
REVOKE ALL ON FUNCTION public.public_city_businesses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_city_businesses() TO anon, authenticated;
