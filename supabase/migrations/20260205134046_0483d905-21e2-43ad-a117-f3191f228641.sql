-- Add is_anonymous column to community_questions
ALTER TABLE public.community_questions
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;