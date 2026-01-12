-- Add offer_type to offers table (per_member = one redemption per membership, per_pet = one redemption per pet)
ALTER TABLE public.offers 
ADD COLUMN offer_type text NOT NULL DEFAULT 'per_member' 
CHECK (offer_type IN ('per_member', 'per_pet'));

-- Add pet_id to offer_redemptions for tracking per-pet redemptions
ALTER TABLE public.offer_redemptions 
ADD COLUMN pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_offer_redemptions_pet_id ON public.offer_redemptions(pet_id);

-- Add comment for clarity
COMMENT ON COLUMN public.offers.offer_type IS 'per_member: one redemption per membership, per_pet: one redemption per pet owned';
COMMENT ON COLUMN public.offer_redemptions.pet_id IS 'For per_pet offers, tracks which pet used the redemption';