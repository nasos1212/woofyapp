-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow insert for authenticated users (for sending invites)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Update generate_share_code function to use simpler format
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
BEGIN
  -- Format: First 3 chars of a random word + 4 random digits
  new_code := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 3)) || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  RETURN new_code;
END;
$function$;

-- Create function to generate member-based share code
CREATE OR REPLACE FUNCTION public.generate_member_share_code(member_name TEXT)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  name_prefix TEXT;
  new_code TEXT;
BEGIN
  -- Get first 3 letters of the name (uppercase), fallback to 'MEM' if empty
  name_prefix := UPPER(COALESCE(SUBSTRING(REGEXP_REPLACE(member_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 3), 'MEM'));
  IF LENGTH(name_prefix) < 3 THEN
    name_prefix := name_prefix || REPEAT('X', 3 - LENGTH(name_prefix));
  END IF;
  
  -- Format: NAME-1234
  new_code := name_prefix || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  RETURN new_code;
END;
$function$;