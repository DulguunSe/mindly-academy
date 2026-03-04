-- Create quiz questions table
CREATE TABLE public.quiz_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_option_index INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage quiz questions
CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view quiz questions for lessons they have access to
CREATE POLICY "Users can view quiz questions for purchased courses"
ON public.quiz_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM lessons l
        JOIN purchases p ON p.course_id = l.course_id
        WHERE l.id = quiz_questions.lesson_id
        AND p.user_id = auth.uid()
        AND p.status = 'completed'
    )
);

-- Create quiz attempts table to track user answers
CREATE TABLE public.quiz_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}',
    passed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts
CREATE POLICY "Users can update their own quiz attempts"
ON public.quiz_attempts FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all attempts
CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add lesson_type column to lessons table
ALTER TABLE public.lessons ADD COLUMN lesson_type TEXT NOT NULL DEFAULT 'video';

-- Create indexes
CREATE INDEX idx_quiz_questions_lesson_id ON public.quiz_questions(lesson_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_lesson_id ON public.quiz_attempts(lesson_id);