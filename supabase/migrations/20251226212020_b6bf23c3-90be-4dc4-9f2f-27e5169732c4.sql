-- Create storage bucket for business photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view business photos
CREATE POLICY "Public can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

-- Allow business owners to upload photos
CREATE POLICY "Business owners can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-photos' 
  AND auth.uid() IS NOT NULL
);

-- Allow business owners to update their photos
CREATE POLICY "Business owners can update their photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow business owners to delete their photos
CREATE POLICY "Business owners can delete their photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policies for admins to manage businesses
CREATE POLICY "Admins can view all businesses"
ON public.businesses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all businesses"
ON public.businesses FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to manage user roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));