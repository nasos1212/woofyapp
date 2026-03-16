-- Add new business category enum values
ALTER TYPE public.business_category ADD VALUE IF NOT EXISTS 'pet_transport';
ALTER TYPE public.business_category ADD VALUE IF NOT EXISTS 'pet_photography';
ALTER TYPE public.business_category ADD VALUE IF NOT EXISTS 'dog_walking';
ALTER TYPE public.business_category ADD VALUE IF NOT EXISTS 'pet_insurance';