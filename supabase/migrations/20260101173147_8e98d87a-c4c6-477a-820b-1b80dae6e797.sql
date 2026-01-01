-- Add vaccination_reminders table for more granular reminder settings
CREATE TABLE public.vaccination_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_health_record_id UUID NOT NULL REFERENCES public.pet_health_records(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vaccination_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their vaccination reminders"
  ON public.vaccination_reminders FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create vaccination reminders"
  ON public.vaccination_reminders FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their vaccination reminders"
  ON public.vaccination_reminders FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their vaccination reminders"
  ON public.vaccination_reminders FOR DELETE
  USING (owner_user_id = auth.uid());