-- Fix 1: CRITICAL - Remove the dangerous self-insert policy that allows privilege escalation
-- Any user can currently insert themselves as admin - this must be removed immediately
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- The admin-only insert policy already exists from migration 20251226212020:
-- "Admins can insert user roles" with has_role(auth.uid(), 'admin')

-- Fix 2: Drop the unused business_customer_pets view that exposes customer PII
-- The application already uses RLS-protected tables directly instead of this view
DROP VIEW IF EXISTS public.business_customer_pets;