
-- Delete related data first, then the users
DELETE FROM public.memberships WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM public.profiles WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM public.user_roles WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM public.notifications WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM public.user_activity_tracking WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM public.user_achievements WHERE user_id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
DELETE FROM auth.users WHERE id IN ('117c0c2e-d0be-44b6-b17f-2232e965af77', '4fde6ed1-62bd-4a30-bd7d-2343a721a25c');
