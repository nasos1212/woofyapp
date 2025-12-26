-- Add time-sensitive offer fields to the offers table
ALTER TABLE public.offers
ADD COLUMN valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_limited_time BOOLEAN DEFAULT false,
ADD COLUMN limited_time_label TEXT;