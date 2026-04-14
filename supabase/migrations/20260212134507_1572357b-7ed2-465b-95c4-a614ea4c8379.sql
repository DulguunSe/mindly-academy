
-- RPC: Fetch quiz questions WITHOUT correct_option_index
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_lesson_id uuid)
RETURNS TABLE(id uuid, question text, options jsonb, order_index integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.question, q.options, q.order_index
  FROM quiz_questions q
  JOIN lessons l ON l.id = q.lesson_id
  JOIN purchases p ON p.course_id = l.course_id
  WHERE q.lesson_id = p_lesson_id
    AND p.user_id = auth.uid()
    AND p.status = 'completed'
  ORDER BY q.order_index ASC;
$$;

-- RPC: Submit quiz answers and validate server-side
CREATE OR REPLACE FUNCTION public.submit_quiz_answers(p_lesson_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_total integer := 0;
  v_passed boolean;
  v_question record;
  v_selected integer;
BEGIN
  -- Verify user has purchased the course
  IF NOT EXISTS (
    SELECT 1 FROM lessons l
    JOIN purchases p ON p.course_id = l.course_id
    WHERE l.id = p_lesson_id AND p.user_id = auth.uid() AND p.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calculate score
  FOR v_question IN
    SELECT id, correct_option_index FROM quiz_questions WHERE lesson_id = p_lesson_id
  LOOP
    v_total := v_total + 1;
    v_selected := (p_answers->>v_question.id::text)::integer;
    IF v_selected IS NOT NULL AND v_selected = v_question.correct_option_index THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No questions found';
  END IF;

  v_passed := v_score >= CEIL(v_total * 0.7);

  -- Upsert attempt
  INSERT INTO quiz_attempts (user_id, lesson_id, score, total_questions, passed, answers, completed_at)
  VALUES (auth.uid(), p_lesson_id, v_score, v_total, v_passed, p_answers, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET score = v_score, total_questions = v_total, passed = v_passed, answers = p_answers, completed_at = now();

  RETURN jsonb_build_object('score', v_score, 'total_questions', v_total, 'passed', v_passed);
END;
$$;

-- RPC: Fetch certificate exam questions WITHOUT correct_option_index
CREATE OR REPLACE FUNCTION public.get_exam_questions(p_course_id uuid)
RETURNS TABLE(id uuid, exam_id uuid, question text, options jsonb, order_index integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.exam_id, q.question, q.options, q.order_index
  FROM certificate_exam_questions q
  JOIN certificate_exams e ON e.id = q.exam_id
  JOIN purchases p ON p.course_id = e.course_id
  WHERE e.course_id = p_course_id
    AND p.user_id = auth.uid()
    AND p.status = 'completed'
  ORDER BY q.order_index ASC;
$$;

-- RPC: Submit certificate exam answers and validate server-side
CREATE OR REPLACE FUNCTION public.submit_exam_answers(p_course_id uuid, p_answers jsonb, p_recipient_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_total integer := 0;
  v_passing_score integer;
  v_percentage integer;
  v_passed boolean;
  v_question record;
  v_selected integer;
  v_exam_id uuid;
  v_issued_at timestamptz;
BEGIN
  -- Verify user has purchased the course
  IF NOT EXISTS (
    SELECT 1 FROM purchases WHERE course_id = p_course_id AND user_id = auth.uid() AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if already has certificate
  IF EXISTS (
    SELECT 1 FROM certificates WHERE course_id = p_course_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Certificate already exists';
  END IF;

  -- Get exam info
  SELECT id, passing_score INTO v_exam_id, v_passing_score
  FROM certificate_exams WHERE course_id = p_course_id;

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'No exam found';
  END IF;

  -- Calculate score
  FOR v_question IN
    SELECT id, correct_option_index FROM certificate_exam_questions WHERE exam_id = v_exam_id
  LOOP
    v_total := v_total + 1;
    v_selected := (p_answers->>v_question.id::text)::integer;
    IF v_selected IS NOT NULL AND v_selected = v_question.correct_option_index THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No questions found';
  END IF;

  v_percentage := ROUND((v_score::numeric / v_total) * 100);
  v_passed := v_percentage >= v_passing_score;

  IF v_passed THEN
    v_issued_at := now();
    INSERT INTO certificates (user_id, course_id, recipient_name, score, total_questions, issued_at)
    VALUES (auth.uid(), p_course_id, p_recipient_name, v_score, v_total, v_issued_at);
  END IF;

  RETURN jsonb_build_object(
    'score', v_score,
    'total_questions', v_total,
    'percentage', v_percentage,
    'passed', v_passed,
    'passing_score', v_passing_score,
    'issued_at', v_issued_at
  );
END;
$$;

-- Remove student SELECT policies on base tables (keep admin policies)
DROP POLICY IF EXISTS "Users can view quiz questions for purchased courses" ON quiz_questions;
DROP POLICY IF EXISTS "Users can view exam questions for purchased courses" ON certificate_exam_questions;
