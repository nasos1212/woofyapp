-- Update default status to 'pending' for new inquiries
ALTER TABLE public.affiliate_inquiries ALTER COLUMN status SET DEFAULT 'pending';