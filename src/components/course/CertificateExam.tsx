import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Trophy, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CertificateGenerator from "./CertificateGenerator";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  order_index: number;
}

interface CertificateData {
  recipientName: string;
  courseName: string;
  issuedAt: string;
  score: number;
  totalQuestions: number;
}

interface CertificateExamProps {
  courseId: string;
  courseName: string;
  userId: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

const CertificateExam = ({
  courseId,
  courseName,
  userId,
  completedLessonsCount,
  totalLessonsCount,
}: CertificateExamProps) => {
  const [hasExam, setHasExam] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [passingScore, setPassingScore] = useState(70);
  const [failedResult, setFailedResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  const isUnlocked = completedLessonsCount >= totalLessonsCount && totalLessonsCount > 0;

  useEffect(() => {
    fetchExamData();
  }, [courseId, userId]);

  const fetchExamData = async () => {
    setLoading(true);

    // Check if user already has certificate
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (existingCert) {
      setCertificate({
        recipientName: existingCert.recipient_name,
        courseName,
        issuedAt: existingCert.issued_at,
        score: existingCert.score,
        totalQuestions: existingCert.total_questions,
      });
      setIsSubmitted(true);
      setLoading(false);
      return;
    }

    // Fetch exam info
    const { data: examData } = await supabase
      .from("certificate_exams")
      .select("*")
      .eq("course_id", courseId)
      .single();

    if (examData) {
      setHasExam(true);
      setPassingScore(examData.passing_score);

      // Fetch questions via RPC (no correct_option_index exposed)
      const { data: questionsData } = await supabase.rpc("get_exam_questions", {
        p_course_id: courseId,
      });

      if (questionsData) {
        const parsedQuestions = questionsData.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
        }));
        setQuestions(parsedQuestions);
      }
    }

    setLoading(false);
  };

  const handleStartExam = () => setShowNameInput(true);

  const handleConfirmName = () => {
    if (!recipientName.trim()) {
      toast.error("Нэрээ оруулна уу");
      return;
    }
    setShowNameInput(false);
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
    // Submit via server-side RPC
    const { data, error } = await supabase.rpc("submit_exam_answers", {
      p_course_id: courseId,
      p_answers: selectedAnswers,
      p_recipient_name: recipientName,
    });

    if (error) {
      toast.error("Алдаа гарлаа");
      return;
    }

    const res = data as any;

    if (res.passed) {
      setCertificate({
        recipientName,
        courseName,
        issuedAt: res.issued_at,
        score: res.score,
        totalQuestions: res.total_questions,
      });
      toast.success("Баяр хүргэе! Сертификат авлаа!");
    } else {
      setFailedResult({ score: res.score, total: res.total_questions, percentage: res.percentage });
      toast.error(`Дутуу. ${res.passing_score}% шаардлагатай, та ${res.percentage}% авлаа.`);
    }

    setIsSubmitted(true);
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setFailedResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasExam || questions.length === 0) {
    return (
      <div className="text-center p-8">
        <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Сертификатийн шалгалт</h3>
        <p className="text-muted-foreground">Энэ сургалтад сертификатийн шалгалт тохируулаагүй байна.</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Шалгалт түгжигдсэн</h3>
        <p className="text-muted-foreground mb-4">Сертификатийн шалгалт өгөхийн тулд бүх хичээлийг дуусгана уу.</p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{completedLessonsCount}/{totalLessonsCount} хичээл дууссан</span>
        </div>
      </div>
    );
  }

  if (isSubmitted && certificate) {
    return (
      <CertificateGenerator
        recipientName={certificate.recipientName}
        courseName={certificate.courseName}
        issuedAt={certificate.issuedAt}
        score={certificate.score}
        totalQuestions={certificate.totalQuestions}
      />
    );
  }

  if (isSubmitted && failedResult) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Дутуу</h3>
        <p className="text-muted-foreground mb-4">
          Та {failedResult.total} асуултаас {failedResult.score} зөв хариулсан
        </p>
        <div className="text-4xl font-bold text-red-600 mb-2">{failedResult.percentage}%</div>
        <p className="text-sm text-muted-foreground mb-6">Тэнцэхэд {passingScore}% шаардлагатай</p>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Дахин оролдох
        </Button>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <Award className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-bold mb-2">Сертификатийн шалгалт</h3>
        <p className="text-muted-foreground mb-6">Сертификат дээр байршуулах нэрээ оруулна уу</p>
        <div className="space-y-4">
          <Input
            placeholder="Таны нэр"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="text-center text-lg"
          />
          <Button onClick={handleConfirmName} className="w-full">Шалгалт эхлүүлэх</Button>
        </div>
      </div>
    );
  }

  if (!showNameInput && !recipientName) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-4">
          <Award className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Сертификатийн шалгалт</h3>
        <p className="text-muted-foreground mb-2">Бүх хичээлийг амжилттай дуусгалаа!</p>
        <p className="text-sm text-muted-foreground mb-6">
          Сертификат авахын тулд шалгалт өгнө үү. ({questions.length} асуулт, {passingScore}% тэнцэх оноо)
        </p>
        <Button onClick={handleStartExam} size="lg" className="gap-2">
          <Award className="h-5 w-5" />
          Шалгалт эхлүүлэх
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">Асуулт {currentIndex + 1}/{questions.length}</span>
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
                <RadioGroupItem value={index.toString()} id={`cert-option-${index}`} />
                <Label htmlFor={`cert-option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
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

export default CertificateExam;
