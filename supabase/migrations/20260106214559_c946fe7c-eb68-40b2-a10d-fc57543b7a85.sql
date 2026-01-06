
-- Create community categories
CREATE TABLE public.community_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.community_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.community_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, display_order) VALUES
('Health & Symptoms', 'health-symptoms', 'Questions about health issues, symptoms, and medical concerns', '🏥', 1),
('Behavior & Training', 'behavior-training', 'Training tips, behavioral issues, and obedience questions', '🎓', 2),
('Nutrition & Diet', 'nutrition-diet', 'Food recommendations, dietary concerns, and feeding schedules', '🍖', 3),
('Grooming & Care', 'grooming-care', 'Grooming tips, coat care, and hygiene questions', '✨', 4),
('Puppies & New Dogs', 'puppies-new-dogs', 'Questions about raising puppies and welcoming new dogs', '🐶', 5),
('Senior Dogs', 'senior-dogs', 'Care for aging dogs and senior-specific concerns', '🦮', 6),
('Exercise & Activities', 'exercise-activities', 'Exercise needs, activities, and playtime ideas', '🏃', 7),
('Products & Gear', 'products-gear', 'Recommendations for products, toys, and equipment', '🦴', 8),
('Emergency & Urgent', 'emergency-urgent', 'Urgent situations requiring immediate community guidance', '🚨', 9),
('Success Stories', 'success-stories', 'Share your wins and recovery stories', '🎉', 10);

-- Create community questions table
CREATE TABLE public.community_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.community_categories(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'general' CHECK (urgency IN ('general', 'concerned', 'urgent')),
  breed_tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved', 'closed')),
  is_pinned BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helped_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view questions
CREATE POLICY "Authenticated users can view questions"
ON public.community_questions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create questions
CREATE POLICY "Users can create questions"
ON public.community_questions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own questions
CREATE POLICY "Users can update their own questions"
ON public.community_questions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own questions
CREATE POLICY "Users can delete their own questions"
ON public.community_questions
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all questions
CREATE POLICY "Admins can manage all questions"
ON public.community_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create question photos table
CREATE TABLE public.community_question_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_question_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view question photos"
ON public.community_question_photos
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question owners can manage photos"
ON public.community_question_photos
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.community_questions
  WHERE id = community_question_photos.question_id
  AND user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.community_questions
  WHERE id = community_question_photos.question_id
  AND user_id = auth.uid()
));

-- Create community answers table
CREATE TABLE public.community_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  is_verified_pro BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view answers"
ON public.community_answers
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create answers"
ON public.community_answers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
ON public.community_answers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
ON public.community_answers
FOR DELETE
USING (auth.uid() = user_id);

-- Create answer photos table
CREATE TABLE public.community_answer_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.community_answers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_answer_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view answer photos"
ON public.community_answer_photos
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Answer owners can manage photos"
ON public.community_answer_photos
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.community_answers
  WHERE id = community_answer_photos.answer_id
  AND user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.community_answers
  WHERE id = community_answer_photos.answer_id
  AND user_id = auth.uid()
));

-- Create votes table
CREATE TABLE public.community_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.community_answers(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, answer_id)
);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
ON public.community_votes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own votes"
ON public.community_votes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create saved/bookmarked questions
CREATE TABLE public.community_saved_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.community_saved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their saved questions"
ON public.community_saved_questions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create "this helped me" table
CREATE TABLE public.community_helped (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.community_helped ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their helped marks"
ON public.community_helped
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create follow questions table
CREATE TABLE public.community_question_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.community_question_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their followed questions"
ON public.community_question_followers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create expert reputation table
CREATE TABLE public.community_expert_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_answers INTEGER DEFAULT 0,
  accepted_answers INTEGER DEFAULT 0,
  total_upvotes INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  expertise_areas TEXT[] DEFAULT '{}',
  is_verified_professional BOOLEAN DEFAULT false,
  professional_title TEXT,
  professional_credentials TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_expert_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view expert stats"
ON public.community_expert_stats
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own stats"
ON public.community_expert_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.community_expert_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_community_questions_updated_at
BEFORE UPDATE ON public.community_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_answers_updated_at
BEFORE UPDATE ON public.community_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update answer vote counts
CREATE OR REPLACE FUNCTION public.update_answer_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.community_answers SET upvotes = upvotes + 1 WHERE id = NEW.answer_id;
    ELSE
      UPDATE public.community_answers SET downvotes = downvotes + 1 WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.community_answers SET upvotes = upvotes - 1 WHERE id = OLD.answer_id;
    ELSE
      UPDATE public.community_answers SET downvotes = downvotes - 1 WHERE id = OLD.answer_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.community_answers SET upvotes = upvotes - 1 WHERE id = OLD.answer_id;
    ELSE
      UPDATE public.community_answers SET downvotes = downvotes - 1 WHERE id = OLD.answer_id;
    END IF;
    IF NEW.vote_type = 'up' THEN
      UPDATE public.community_answers SET upvotes = upvotes + 1 WHERE id = NEW.answer_id;
    ELSE
      UPDATE public.community_answers SET downvotes = downvotes + 1 WHERE id = NEW.answer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.community_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_answer_votes();

-- Create function to update helped count
CREATE OR REPLACE FUNCTION public.update_helped_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_questions SET helped_count = helped_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_questions SET helped_count = helped_count - 1 WHERE id = OLD.question_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_helped_change
AFTER INSERT OR DELETE ON public.community_helped
FOR EACH ROW
EXECUTE FUNCTION public.update_helped_count();

-- Create indexes for better performance
CREATE INDEX idx_community_questions_user_id ON public.community_questions(user_id);
CREATE INDEX idx_community_questions_category_id ON public.community_questions(category_id);
CREATE INDEX idx_community_questions_status ON public.community_questions(status);
CREATE INDEX idx_community_questions_urgency ON public.community_questions(urgency);
CREATE INDEX idx_community_questions_created_at ON public.community_questions(created_at DESC);
CREATE INDEX idx_community_answers_question_id ON public.community_answers(question_id);
CREATE INDEX idx_community_answers_user_id ON public.community_answers(user_id);
CREATE INDEX idx_community_votes_answer_id ON public.community_votes(answer_id);

-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public) VALUES ('community-photos', 'community-photos', true);

-- Storage policies for community photos
CREATE POLICY "Anyone can view community photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-photos');

CREATE POLICY "Authenticated users can upload community photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
