-- Create email verification tokens table
CREATE TABLE public.email_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tokens
CREATE POLICY "Users can view own verification tokens"
ON public.email_verification_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Add email_verified column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create index for faster token lookup
CREATE INDEX idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_verification_tokens_user ON public.email_verification_tokens(user_id);