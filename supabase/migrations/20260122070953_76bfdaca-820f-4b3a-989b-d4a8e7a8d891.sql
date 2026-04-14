-- Create certificate exams table (course-level final exam)
CREATE TABLE public.certificate_exams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    passing_score INTEGER NOT NULL DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificate exam questions table
CREATE TABLE public.certificate_exam_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.certificate_exams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_option_index INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificates table (issued to users)
CREATE TABLE public.certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.certificate_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS policies for certificate_exams
CREATE POLICY "Admins can manage certificate exams"
ON public.certificate_exams FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view certificate exams for purchased courses"
ON public.certificate_exams FOR SELECT
USING (EXISTS (
    SELECT 1 FROM purchases 
    WHERE purchases.course_id = certificate_exams.course_id 
    AND purchases.user_id = auth.uid() 
    AND purchases.status = 'completed'
));

-- RLS policies for certificate_exam_questions
CREATE POLICY "Admins can manage certificate exam questions"
ON public.certificate_exam_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view exam questions for purchased courses"
ON public.certificate_exam_questions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM certificate_exams ce
    JOIN purchases p ON p.course_id = ce.course_id
    WHERE ce.id = certificate_exam_questions.exam_id
    AND p.user_id = auth.uid()
    AND p.status = 'completed'
));

-- RLS policies for certificates
CREATE POLICY "Admins can view all certificates"
ON public.certificates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
ON public.certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);