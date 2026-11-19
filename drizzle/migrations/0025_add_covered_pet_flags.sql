ALTER TABLE public.pets ADD COLUMN is_covered boolean NOT NULL DEFAULT false;
ALTER TABLE public.pets ADD COLUMN covered_at timestamptz;

COMMENT ON COLUMN public.pets.is_covered IS 'True when this pet holds one of the paid plan covered slots (birthday offers and paid perks).';
COMMENT ON COLUMN public.pets.covered_at IS 'When the pet was last marked as covered; swaps are locked for 12 months from this date.';

WITH ranked AS (
  SELECT p.id,
         ROW_NUMBER() OVER (PARTITION BY p.membership_id ORDER BY p.created_at ASC) AS rn,
         m.max_pets
  FROM public.pets p
  JOIN public.memberships m ON m.id = p.membership_id
  WHERE m.is_active = true AND m.plan_type <> 'free'
)
UPDATE public.pets p
SET is_covered = true, covered_at = now()
FROM ranked r
WHERE p.id = r.id AND r.rn <= r.max_pets;