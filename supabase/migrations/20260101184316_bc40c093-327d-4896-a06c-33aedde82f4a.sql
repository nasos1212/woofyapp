-- Create table to track verification attempts
CREATE TABLE public.verification_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  attempted_member_id text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

-- Business owners can view their own attempts
CREATE POLICY "Business owners can view their verification attempts"
ON public.verification_attempts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = verification_attempts.business_id
  AND businesses.user_id = auth.uid()
));

-- Create index for efficient queries
CREATE INDEX idx_verification_attempts_business_created 
ON public.verification_attempts(business_id, created_at DESC);

CREATE INDEX idx_verification_attempts_ip_created 
ON public.verification_attempts(ip_address, created_at DESC) 
WHERE ip_address IS NOT NULL;