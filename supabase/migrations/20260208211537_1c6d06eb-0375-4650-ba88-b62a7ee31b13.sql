-- Set the sequence to start after existing memberships (11 existing, so start at 12)
INSERT INTO public.member_number_sequences (year, current_value)
VALUES (2026, 11)
ON CONFLICT (year) DO UPDATE SET current_value = 11;