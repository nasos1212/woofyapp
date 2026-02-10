-- Change shelters.user_id foreign key from SET NULL to CASCADE
ALTER TABLE public.shelters
  DROP CONSTRAINT IF EXISTS shelters_user_id_fkey;

ALTER TABLE public.shelters
  ADD CONSTRAINT shelters_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;