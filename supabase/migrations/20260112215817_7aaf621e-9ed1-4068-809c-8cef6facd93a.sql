-- Add pet info columns to ai_chat_sessions
ALTER TABLE public.ai_chat_sessions
ADD COLUMN pet_name TEXT,
ADD COLUMN pet_breed TEXT;