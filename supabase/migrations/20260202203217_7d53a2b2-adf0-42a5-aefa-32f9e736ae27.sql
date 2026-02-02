-- Ensure the overly permissive business profile access policy is removed
-- Re-drop in case the previous drop didn't take effect
DROP POLICY IF EXISTS "Businesses can view customer profiles" ON public.profiles;

-- Also ensure the pets policy was properly replaced
DROP POLICY IF EXISTS "Businesses can view pets of members who redeemed their offers" ON public.pets;

-- Verify the new restrictive policy exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pets' 
    AND policyname = 'Businesses can view specific redeemed pets only'
  ) THEN
    CREATE POLICY "Businesses can view specific redeemed pets only"
      ON public.pets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM offer_redemptions r
          JOIN businesses b ON b.id = r.business_id
          WHERE r.pet_id = pets.id
            AND b.user_id = auth.uid()
        )
      );
  END IF;
END
$$;