import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Video,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  FileQuestion,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuizEditor from "@/components/admin/QuizEditor";
import CertificateExamEditor from "@/components/admin/CertificateExamEditor";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_preview: boolean | null;
  vimeo_video_id: string | null;
  course_id: string;
  lesson_type: string;
}

interface Course {
  id: string;
  title: string;
}

interface LessonFormData {
  title: string;
  description: string;
  duration_minutes: number;
  is_preview: boolean;
  vimeo_video_id: string;
  lesson_type: "video" | "quiz";
}

const initialFormData: LessonFormData = {
  title: "",
  description: "",
  duration_minutes: 0,
  is_preview: false,
  vimeo_video_id: "",
  lesson_type: "video",
};

const AdminCourseLessons = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(initialFormData);
  const [quizEditorLesson, setQuizEditorLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, [courseId]);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Админ эрхгүй байна");
      navigate("/dashboard");
      return;
    }

    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    if (!courseId) return;

    // Fetch course
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .single();

    if (courseError || !courseData) {
      toast.error("Сургалт олдсонгүй");
      navigate("/admin");
      return;
    }

    setCourse(courseData);

    // Fetch lessons
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    setLessons(lessonsData || []);
  };

  const openAddDialog = () => {
    setEditingLesson(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      duration_minutes: lesson.duration_minutes || 0,
      is_preview: lesson.is_preview || false,
      vimeo_video_id: lesson.vimeo_video_id || "",
      lesson_type: (lesson.lesson_type as "video" | "quiz") || "video",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Хичээлийн нэр оруулна уу");
      return;
    }

    setSaving(true);

    try {
      if (editingLesson) {
        // Update existing lesson
        const { error } = await supabase
          .from("lessons")
          .update({
            title: formData.title,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            is_preview: formData.is_preview,
            vimeo_video_id: formData.lesson_type === "video" ? (formData.vimeo_video_id || null) : null,
            lesson_type: formData.lesson_type,
          })
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast.success("Хичээл амжилттай шинэчлэгдлээ");
      } else {
        // Create new lesson
        const newOrderIndex = lessons.length > 0 
          ? Math.max(...lessons.map(l => l.order_index)) + 1 
          : 0;

        const { error } = await supabase.from("lessons").insert({
          course_id: courseId,
          title: formData.title,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          is_preview: formData.is_preview,
          vimeo_video_id: formData.lesson_type === "video" ? (formData.vimeo_video_id || null) : null,
          order_index: newOrderIndex,
          lesson_type: formData.lesson_type,
        });

        if (error) throw error;
        toast.success("Хичээл амжилттай нэмэгдлээ");

        // Update course lessons_count
        await supabase
          .from("courses")
          .update({ lessons_count: lessons.length + 1 })
          .eq("id", courseId);
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      toast.error(error.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Хичээл амжилттай устгагдлаа");

      // Update course lessons_count
      await supabase
        .from("courses")
        .update({ lessons_count: Math.max(0, lessons.length - 1) })
        .eq("id", courseId);

      fetchData();
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  const togglePreview = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .update({ is_preview: !lesson.is_preview })
        .eq("id", lesson.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      toast.error("Алдаа гарлаа");
    }
  };

  const moveLesson = async (lessonId: string, direction: "up" | "down") => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const currentLesson = lessons[currentIndex];
    const swapLesson = lessons[newIndex];

    try {
      await Promise.all([
        supabase
          .from("lessons")
          .update({ order_index: swapLesson.order_index })
          .eq("id", currentLesson.id),
        supabase
          .from("lessons")
          .update({ order_index: currentLesson.order_index })
          .eq("id", swapLesson.id),
      ]);

      fetchData();
    } catch (error) {
      toast.error("Дараалал солиход алдаа гарлаа");
    }
  };

  const handleChange = (field: keyof LessonFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const extractVimeoId = (input: string): string => {
    // If it's just a number, return as is
    if (/^\d+$/.test(input.trim())) {
      return input.trim();
    }
    // Try to extract from URL
    const match = input.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : input.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Хичээлүүд</h1>
              <p className="text-muted-foreground">{course?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {courseId && <CertificateExamEditor courseId={courseId} />}
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Хичээл нэмэх
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {lessons.length > 0 ? (
            <div className="divide-y divide-border">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveLesson(lesson.id, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveLesson(lesson.id, "down")}
                      disabled={index === lessons.length - 1}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>

                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {lesson.lesson_type === "quiz" ? (
                      <ClipboardList className="h-5 w-5 text-primary" />
                    ) : (
                      <span className="font-semibold text-primary">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{lesson.title}</h3>
                      {lesson.lesson_type === "quiz" && (
                        <Badge variant="outline" className="shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                          Тест
                        </Badge>
                      )}
                      {lesson.is_preview && (
                        <Badge variant="secondary" className="shrink-0">
                          Үнэгүй үзэх
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                        <span>{lesson.duration_minutes} мин</span>
                      )}
                      {lesson.vimeo_video_id && (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Vimeo: {lesson.vimeo_video_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lesson.lesson_type === "quiz" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuizEditorLesson(lesson)}
                        title="Тестийн асуултууд"
                      >
                        <FileQuestion className="h-4 w-4 text-purple-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePreview(lesson)}
                      title={lesson.is_preview ? "Үнэгүй үзэх унтраах" : "Үнэгүй үзэх болгох"}
                    >
                      {lesson.is_preview ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(lesson)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Хичээл устгах уу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{lesson.title}" хичээл устгагдана. Энэ үйлдлийг буцаах боломжгүй.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Болих</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteLesson(lesson.id)}>
                            Устгах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Хичээл байхгүй байна</p>
              <p className="text-sm mb-4">Эхний хичээлээ нэмнэ үү</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Хичээл нэмэх
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Хичээл засах" : "Шинэ хичээл"}
            </DialogTitle>
            <DialogDescription>
              Хичээлийн мэдээллийг оруулна уу
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lesson Type Selector */}
            <div className="space-y-2">
              <Label>Хичээлийн төрөл</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.lesson_type === "video" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => handleChange("lesson_type", "video")}
                >
                  <Video className="h-4 w-4" />
                  Видео
                </Button>
                <Button
                  type="button"
                  variant={formData.lesson_type === "quiz" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => handleChange("lesson_type", "quiz")}
                >
                  <ClipboardList className="h-4 w-4" />
                  Тест
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Хичээлийн нэр *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Хичээлийн нэрийг оруулна уу"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Хичээлийн тайлбар"
                rows={3}
              />
            </div>

            {formData.lesson_type === "video" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Үргэлжлэх хугацаа (мин)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min={0}
                    value={formData.duration_minutes}
                    onChange={(e) => handleChange("duration_minutes", Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vimeo_video_id">Vimeo Video ID</Label>
                  <Input
                    id="vimeo_video_id"
                    value={formData.vimeo_video_id}
                    onChange={(e) => handleChange("vimeo_video_id", extractVimeoId(e.target.value))}
                    placeholder="123456789"
                  />
                </div>
              </div>
            )}

            {formData.lesson_type === "quiz" && (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Тестийн асуултыг хичээл үүсгэсний дараа засварлах боломжтой</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="is_preview" className="font-medium">
                  Үнэгүй үзэх боломжтой
                </Label>
                <p className="text-sm text-muted-foreground">
                  Худалдан авалгүй үзэх боломжтой хичээл
                </p>
              </div>
              <Switch
                id="is_preview"
                checked={formData.is_preview}
                onCheckedChange={(checked) => handleChange("is_preview", checked)}
              />
            </div>

            {formData.lesson_type === "video" && formData.vimeo_video_id && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <div className="aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${formData.vimeo_video_id}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Болих
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingLesson ? "Хадгалах" : "Нэмэх"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quiz Editor Dialog */}
      <Dialog open={!!quizEditorLesson} onOpenChange={(open) => !open && setQuizEditorLesson(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Тестийн асуултууд</DialogTitle>
            <DialogDescription>
              {quizEditorLesson?.title}
            </DialogDescription>
          </DialogHeader>
          {quizEditorLesson && (
            <QuizEditor 
              lessonId={quizEditorLesson.id} 
              onClose={() => setQuizEditorLesson(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseLessons;
