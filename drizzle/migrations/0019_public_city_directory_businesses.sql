CREATE OR REPLACE FUNCTION public.public_city_directory_businesses()
RETURNS TABLE(id uuid, business_name text, category business_category, categories text[], city text, logo_url text, description text, address text, phone text, website text, google_maps_url text, facebook_url text, instagram_url text, tiktok_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.business_name, b.category, b.categories::text[], b.city, b.logo_url, b.description,
         b.address, b.phone, b.website, b.google_maps_url, b.facebook_url, b.instagram_url, b.tiktok_url
  FROM public.businesses b
  WHERE b.verification_status = 'approved' AND b.is_hidden = false
  ORDER BY b.business_name;
$$;
REVOKE ALL ON FUNCTION public.public_city_directory_businesses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_city_directory_businesses() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.public_city_businesses() IS 'DEPRECATED: replaced by public_city_directory_businesses';