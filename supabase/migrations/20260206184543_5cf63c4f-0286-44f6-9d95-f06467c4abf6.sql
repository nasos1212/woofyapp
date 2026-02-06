-- Allow sender_id to be NULL for anonymous submissions (like affiliate inquiries)
ALTER TABLE public.support_messages ALTER COLUMN sender_id DROP NOT NULL;