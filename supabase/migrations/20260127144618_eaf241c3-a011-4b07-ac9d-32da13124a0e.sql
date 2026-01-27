-- Fix the overly permissive RLS policy on membership_expiry_notifications
-- This table is meant for edge function use only (service role)
-- Regular authenticated users should not be able to insert

-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can insert expiry notifications" ON public.membership_expiry_notifications;

-- The service role bypasses RLS automatically, so no INSERT policy is needed
-- This prevents regular authenticated users from inserting into this table