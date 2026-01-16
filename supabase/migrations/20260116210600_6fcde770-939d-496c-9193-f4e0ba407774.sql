-- Add login_count column to profiles table to track first vs returning users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;