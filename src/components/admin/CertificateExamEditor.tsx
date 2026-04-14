import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExamQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_option_index: number;
  order_index: number;
}

interface CertificateExamEditorProps {
  courseId: string;
}

const CertificateExamEditor = ({ courseId }: CertificateExamEditorProps) => {
  const [open, setOpen] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchExamData();
    }
  }, [open, courseId]);

  const fetchExamData = async () => {
    setLoading(true);

    // Fetch or create exam
    const { data: examData } = await supabase
      .from("certificate_exams")
      .select("*")
      .eq("course_id", courseId)
      .single();

    if (examData) {
      setExamId(examData.id);
      setPassingScore(examData.passing_score);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from("certificate_exam_questions")
        .select("*")
        .eq("exam_id", examData.id)
        .order("order_index", { ascending: true });

      if (questionsData) {
        const parsedQuestions = questionsData.map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
        }));
        setQuestions(parsedQuestions);
      }
    } else {
      setExamId(null);
      setQuestions([]);
    }

    setLoading(false);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correct_option_index: 0,
        order_index: questions.length,
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error("Бүх асуултыг бөглөнө үү");
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.error("Бүх хариултын сонголтыг бөглөнө үү");
        return;
      }
    }

    setSaving(true);

    try {
      let currentExamId = examId;

      // Create or update exam
      if (!currentExamId) {
        const { data: newExam, error: examError } = await supabase
          .from("certificate_exams")
          .insert({
            course_id: courseId,
            passing_score: passingScore,
          })
          .select()
          .single();

        if (examError) throw examError;
        currentExamId = newExam.id;
        setExamId(currentExamId);
      } else {
        await supabase
          .from("certificate_exams")
          .update({ passing_score: passingScore })
          .eq("id", currentExamId);
      }

      // Delete existing questions
      await supabase
        .from("certificate_exam_questions")
        .delete()
        .eq("exam_id", currentExamId);

      // Insert new questions
      if (questions.length > 0) {
        const { error: questionsError } = await supabase
          .from("certificate_exam_questions")
          .insert(
            questions.map((q, index) => ({
              exam_id: currentExamId,
              question: q.question,
              options: q.options,
              correct_option_index: q.correct_option_index,
              order_index: index,
            }))
          );

        if (questionsError) throw questionsError;
      }

      toast.success("Шалгалт хадгалагдлаа");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Award className="h-4 w-4" />
          Сертификатийн шалгалт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Сертификатийн шалгалт засах</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Passing Score */}
            <div className="flex items-center gap-4">
              <Label>Тэнцэх оноо (%):</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="w-24"
              />
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label>Асуулт {qIndex + 1}</Label>
                      <Input
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(qIndex, "question", e.target.value)
                        }
                        placeholder="Асуултаа оруулна уу"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Хариултын сонголтууд (зөвийг сонгоно уу):</Label>
                    <RadioGroup
                      value={q.correct_option_index.toString()}
                      onValueChange={(value) =>
                        updateQuestion(qIndex, "correct_option_index", parseInt(value))
                      }
                    >
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={optIndex.toString()}
                            id={`q${qIndex}-opt${optIndex}`}
                          />
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateOption(qIndex, optIndex, e.target.value)
                            }
                            placeholder={`Сонголт ${optIndex + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Асуулт нэмэх
            </Button>

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Болих
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CertificateExamEditor;
