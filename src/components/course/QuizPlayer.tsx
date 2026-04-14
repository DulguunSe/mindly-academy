import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  order_index: number;
}

interface QuizResult {
  score: number;
  total_questions: number;
  passed: boolean;
}

interface QuizPlayerProps {
  lessonId: string;
  userId: string;
  onComplete: () => void;
}

const QuizPlayer = ({ lessonId, userId, onComplete }: QuizPlayerProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizData();
  }, [lessonId]);

  const fetchQuizData = async () => {
    setLoading(true);

    // Fetch questions via RPC (no correct_option_index exposed)
    const { data: questionsData } = await supabase.rpc("get_quiz_questions", {
      p_lesson_id: lessonId,
    });

    if (questionsData) {
      const parsedQuestions = questionsData.map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
      }));
      setQuestions(parsedQuestions);
    }

    // Fetch previous attempt
    const { data: attemptData } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .single();

    if (attemptData) {
      if (attemptData.passed) {
        setIsSubmitted(true);
        setResult({
          score: attemptData.score,
          total_questions: attemptData.total_questions,
          passed: attemptData.passed,
        });
      }
    }

    setLoading(false);
  };

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    // Submit answers via server-side RPC
    const { data, error } = await supabase.rpc("submit_quiz_answers", {
      p_lesson_id: lessonId,
      p_answers: selectedAnswers,
    });

    if (error) {
      toast.error("Алдаа гарлаа");
      return;
    }

    const res = data as unknown as QuizResult;
    setResult(res);
    setIsSubmitted(true);

    if (res.passed) {
      onComplete();
      toast.success("Тест амжилттай!");
    } else {
      toast.error("Тест дутуу. Дахин оролдоно уу.");
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Тест асуулт байхгүй байна
      </div>
    );
  }

  if (isSubmitted && result) {
    const percentage = Math.round((result.score / result.total_questions) * 100);
    return (
      <div className="p-6 text-center">
        <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
          {result.passed ? <Trophy className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
        </div>
        <h3 className="text-2xl font-bold mb-2">{result.passed ? "Амжилттай!" : "Дутуу"}</h3>
        <p className="text-muted-foreground mb-4">
          Та {result.total_questions} асуултаас {result.score} зөв хариулсан
        </p>
        <div className="text-4xl font-bold mb-6">
          <span className={result.passed ? "text-green-600" : "text-red-600"}>{percentage}%</span>
        </div>
        {!result.passed && (
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Дахин оролдох
          </Button>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">
          Асуулт {currentIndex + 1}/{questions.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
        <RadioGroup
          value={selectedAnswers[currentQuestion.id]?.toString()}
          onValueChange={(value) => handleAnswer(currentQuestion.id, parseInt(value))}
        >
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedAnswers[currentQuestion.id] === index ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleAnswer(currentQuestion.id, index)}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>Өмнөх</Button>
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-3 w-3 rounded-full transition-colors ${
                idx === currentIndex ? "bg-primary" : selectedAnswers[questions[idx].id] !== undefined ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={!allAnswered}>Илгээх</Button>
        ) : (
          <Button onClick={handleNext}>Дараах</Button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
