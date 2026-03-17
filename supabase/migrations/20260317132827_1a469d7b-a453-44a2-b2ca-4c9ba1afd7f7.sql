DELETE FROM public.email_verification_tokens WHERE user_id = '0e0f6555-2b13-4afc-b23b-e73b3d88d77b';
DELETE FROM public.notifications WHERE user_id = '0e0f6555-2b13-4afc-b23b-e73b3d88d77b';
DELETE FROM public.user_roles WHERE user_id = '0e0f6555-2b13-4afc-b23b-e73b3d88d77b';
DELETE FROM public.profiles WHERE user_id = '0e0f6555-2b13-4afc-b23b-e73b3d88d77b';
DELETE FROM auth.users WHERE id = '0e0f6555-2b13-4afc-b23b-e73b3d88d77b';