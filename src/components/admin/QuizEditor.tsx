import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_option_index: number;
  order_index: number;
}

interface QuizEditorProps {
  lessonId: string;
  onClose?: () => void;
}

const QuizEditor = ({ lessonId, onClose }: QuizEditorProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (data) {
      const parsedQuestions = data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));
      setQuestions(parsedQuestions);
    }
    setLoading(false);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correct_option_index: 0,
        order_index: prev.length
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    // Validate
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error("Асуултыг бөглөнө үү");
        return;
      }
      if (q.options.some(o => !o.trim())) {
        toast.error("Бүх хариултыг бөглөнө үү");
        return;
      }
    }

    setSaving(true);

    try {
      // Delete existing questions
      await supabase
        .from("quiz_questions")
        .delete()
        .eq("lesson_id", lessonId);

      // Insert new questions
      if (questions.length > 0) {
        const { error } = await supabase
          .from("quiz_questions")
          .insert(
            questions.map((q, index) => ({
              lesson_id: lessonId,
              question: q.question,
              options: q.options,
              correct_option_index: q.correct_option_index,
              order_index: index
            }))
          );

        if (error) throw error;
      }

      toast.success("Тест хадгалагдлаа");
      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Тестийн асуултууд</h3>
        <Button onClick={addQuestion} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Асуулт нэмэх
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="mb-2">Тест асуулт байхгүй</p>
          <Button onClick={addQuestion} variant="outline" size="sm">
            Эхний асуулт нэмэх
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="p-4 border rounded-lg bg-card"
            >
              <div className="flex items-start gap-3 mb-4">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">
                    Асуулт #{qIndex + 1}
                  </Label>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                    placeholder="Асуултаа оруулна уу..."
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="ml-8">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Хариултууд (зөв хариултыг сонгоно уу)
                </Label>
                <RadioGroup
                  value={question.correct_option_index.toString()}
                  onValueChange={(value) => updateQuestion(qIndex, "correct_option_index", parseInt(value))}
                >
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Хариулт ${oIndex + 1}`}
                          className={question.correct_option_index === oIndex ? "border-green-500" : ""}
                        />
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Болих
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </div>
  );
};

export default QuizEditor;