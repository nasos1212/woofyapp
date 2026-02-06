-- Create a simple affiliate_inquiries table for contact form submissions
CREATE TABLE public.affiliate_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  audience TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated) to submit an inquiry
CREATE POLICY "Anyone can submit affiliate inquiry"
ON public.affiliate_inquiries FOR INSERT
WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view affiliate inquiries"
ON public.affiliate_inquiries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can update inquiries (change status)
CREATE POLICY "Admins can update affiliate inquiries"
ON public.affiliate_inquiries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can delete inquiries
CREATE POLICY "Admins can delete affiliate inquiries"
ON public.affiliate_inquiries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_affiliate_inquiries_updated_at
BEFORE UPDATE ON public.affiliate_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();