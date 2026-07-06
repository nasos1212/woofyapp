GRANT SELECT ON public.businesses_public TO anon, authenticated;
GRANT SELECT ON public.businesses_directory TO anon, authenticated;
GRANT ALL ON public.businesses_public TO service_role;
GRANT ALL ON public.businesses_directory TO service_role;