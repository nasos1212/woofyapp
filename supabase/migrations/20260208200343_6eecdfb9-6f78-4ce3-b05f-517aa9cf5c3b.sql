-- Create a table for community question reports
CREATE TABLE public.community_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE NOT NULL,
    reporter_user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.community_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.community_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id);

-- Admins can view all reports (using has_role function if exists, otherwise basic admin check)
CREATE POLICY "Admins can view all reports"
ON public.community_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.community_reports
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create index for faster lookups
CREATE INDEX idx_community_reports_question_id ON public.community_reports(question_id);
CREATE INDEX idx_community_reports_status ON public.community_reports(status);