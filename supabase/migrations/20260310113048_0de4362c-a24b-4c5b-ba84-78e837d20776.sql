
CREATE TABLE public.pet_friendly_place_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_name TEXT NOT NULL,
  place_type TEXT NOT NULL,
  google_maps_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow anyone (even anonymous) to insert requests
ALTER TABLE public.pet_friendly_place_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a place request"
  ON public.pet_friendly_place_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can view place requests"
  ON public.pet_friendly_place_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
