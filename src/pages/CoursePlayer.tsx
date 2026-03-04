import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Menu,
  X,
  ClipboardList,
  Award,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Player from "@vimeo/player";
import QuizPlayer from "@/components/course/QuizPlayer";
import CertificateExam from "@/components/course/CertificateExam";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  vimeo_video_id: string | null;
  duration_minutes: number | null;
  order_index: number;
  lesson_type: string;
  is_preview: boolean | null;
}

interface Course {
  id: string;
  title: string;
  price: number;
}

interface CompletedLessons {
  [lessonId: string]: boolean;
}

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewLessonId = searchParams.get("preview");
  const [user, setUser] = useState<User | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<CompletedLessons>({});
  const [showCertificateExam, setShowCertificateExam] = useState(false);
  const playerRef = useRef<Player | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user && !previewLessonId) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user && !previewLessonId) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, previewLessonId]);

  useEffect(() => {
    if (courseId) {
      if (previewLessonId) {
        fetchPreviewLesson();
      } else if (user) {
        checkAccessAndFetch();
      }
    }
  }, [user, courseId, previewLessonId]);

  const fetchPreviewLesson = async () => {
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, price")
      .eq("id", courseId)
      .single();

    if (!courseData) { navigate("/courses"); return; }
    setCourse(courseData);

    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("id, title, description, vimeo_video_id, duration_minutes, order_index, lesson_type, is_preview")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsData) {
      setLessons(lessonsData);
      const previewLesson = lessonsData.find(l => l.id === previewLessonId && l.lesson_type !== "quiz");
      if (previewLesson) {
        setCurrentLesson(previewLesson);
        setIsPreviewMode(true);
      } else {
        navigate(`/courses/${courseId}`);
        return;
      }
    }
    setLoading(false);
  };

  const checkAccessAndFetch = async () => {
    // Fetch course details first to check if free
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, price")
      .eq("id", courseId)
      .single();

    if (!courseData) {
      navigate("/courses");
      return;
    }

    setCourse(courseData);

    const isFree = Number(courseData.price) === 0;

    // Check if user has purchased the course (skip for free courses)
    if (!isFree) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user?.id)
        .eq("course_id", courseId)
        .eq("status", "completed")
        .maybeSingle();

      if (!purchase) {
        navigate(`/courses/${courseId}`);
        return;
      }
    } else {
      // For free courses, auto-create purchase if not exists
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user?.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!existingPurchase) {
        await supabase.from("purchases").insert({
          user_id: user!.id,
          course_id: courseId!,
          amount: 0,
          payment_method: "free",
          payment_id: "free",
          status: "completed",
        });
      }
    }

    // Fetch lessons
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("id, title, description, vimeo_video_id, duration_minutes, order_index, lesson_type, is_preview")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsData && lessonsData.length > 0) {
      setLessons(lessonsData);
      
      // Fetch all completed lessons for this course
      const { data: allProgressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed, last_watched_at")
        .eq("user_id", user?.id)
        .eq("course_id", courseId);

      if (allProgressData) {
        const completed: CompletedLessons = {};
        allProgressData.forEach(p => {
          if (p.completed) {
            completed[p.lesson_id] = true;
          }
        });
        setCompletedLessons(completed);

        // Find last watched lesson
        const sorted = [...allProgressData].sort(
          (a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
        );
        if (sorted.length > 0) {
          const lastLesson = lessonsData.find(l => l.id === sorted[0].lesson_id);
          setCurrentLesson(lastLesson || lessonsData[0]);
        } else {
          setCurrentLesson(lessonsData[0]);
        }
      } else {
        setCurrentLesson(lessonsData[0]);
      }
    }

    setLoading(false);
  };

  // Mark lesson as completed
  const markLessonCompleted = useCallback(async (lessonId: string) => {
    if (!user || !courseId) return;
    
    await supabase
      .from("lesson_progress")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        completed: true,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,lesson_id"
      });

    setCompletedLessons(prev => ({ ...prev, [lessonId]: true }));
  }, [user, courseId]);

  // Setup Vimeo player event listener
  useEffect(() => {
    if (!currentLesson?.vimeo_video_id || !iframeRef.current) return;

    // Clean up previous player
    if (playerRef.current) {
      playerRef.current.off("ended");
      playerRef.current = null;
    }

    // Create new player and listen for video end
    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.on("ended", () => {
      markLessonCompleted(currentLesson.id);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.off("ended");
      }
    };
  }, [currentLesson?.id, currentLesson?.vimeo_video_id, markLessonCompleted]);

  const handleLessonSelect = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    
    // Save progress
    if (user && courseId) {
      await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lesson.id,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,lesson_id"
        });
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4">
        <Link
          to={isPreviewMode ? `/courses/${courseId}` : "/dashboard"}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Буцах</span>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{course?.title}</h1>
        </div>
        
        {/* Progress indicator */}
        {!isPreviewMode && (
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              {Object.keys(completedLessons).length}/{lessons.length} хичээл
            </span>
          </div>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ 
                width: `${lessons.length > 0 ? (Object.keys(completedLessons).length / lessons.length) * 100 : 0}%` 
              }}
            />
          </div>
          <span className="font-medium text-green-600">
            {lessons.length > 0 ? Math.round((Object.keys(completedLessons).length / lessons.length) * 100) : 0}%
          </span>
        </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {showCertificateExam ? (
            /* Certificate Exam Content */
            <div className="flex-1 bg-card">
              <CertificateExam
                courseId={courseId || ""}
                courseName={course?.title || ""}
                userId={user?.id || ""}
                completedLessonsCount={Object.keys(completedLessons).length}
                totalLessonsCount={lessons.length}
              />
            </div>
          ) : currentLesson?.lesson_type === "quiz" ? (
            /* Quiz Content */
            <div className="flex-1 bg-card">
              <QuizPlayer
                lessonId={currentLesson.id}
                userId={user?.id || ""}
                onComplete={() => markLessonCompleted(currentLesson.id)}
              />
            </div>
          ) : (
            /* Video Content */
            <>
              <div className="aspect-video bg-black relative flex-shrink-0">
                {currentLesson?.vimeo_video_id ? (
                  <iframe
                    ref={iframeRef}
                    src={`https://player.vimeo.com/video/${currentLesson.vimeo_video_id}?h=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <div className="text-center">
                      <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Видео байхгүй байна</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Current Lesson Info */}
          {!showCertificateExam && (
            <div className="p-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {currentLesson?.lesson_type === "quiz" && (
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  )}
                  <h2 className="text-2xl font-bold">{currentLesson?.title}</h2>
                </div>
                {currentLesson?.description && (
                  <p className="text-muted-foreground">{currentLesson.description}</p>
                )}
              </div>
              {currentLesson && currentLesson.lesson_type !== "quiz" && (
                <Button
                  variant={completedLessons[currentLesson.id] ? "secondary" : "default"}
                  size="sm"
                  className="flex-shrink-0 gap-2"
                  onClick={() => markLessonCompleted(currentLesson.id)}
                  disabled={completedLessons[currentLesson.id]}
                >
                  <CheckCircle className="h-4 w-4" />
                  {completedLessons[currentLesson.id] ? "Үзсэн" : "Үзсэн гэж тэмдэглэх"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Lesson List */}
        <div
          className={`
            fixed lg:relative inset-y-0 right-0 w-80 bg-card border-l border-border
            transform transition-transform duration-300 z-40
            ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            lg:block top-16 lg:top-0
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Хичээлүүд</h3>
              <p className="text-sm text-muted-foreground">
                {lessons.length} хичээл
              </p>
            </div>
            {/* Certificate Exam Button */}
            {!isPreviewMode && (
            <div className="p-2 border-b border-border">
              <button
                onClick={() => {
                  setShowCertificateExam(true);
                  setCurrentLesson(null);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  showCertificateExam
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      showCertificateExam
                        ? "bg-primary text-primary-foreground"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Сертификатийн шалгалт</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(completedLessons).length >= lessons.length && lessons.length > 0
                        ? "Шалгалт өгөх боломжтой"
                        : `${Object.keys(completedLessons).length}/${lessons.length} хичээл дууссан`}
                    </p>
                  </div>
                </div>
              </button>
            </div>
            )}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {lessons.map((lesson, index) => {
                    const isLocked = isPreviewMode && !lesson.is_preview;
                    return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        if (isLocked) return;
                        setShowCertificateExam(false);
                        handleLessonSelect(lesson);
                      }}
                      disabled={isLocked}
                      className={`
                        w-full text-left p-3 rounded-lg mb-1 transition-colors
                        ${isLocked ? "opacity-50 cursor-not-allowed" : ""}
                        ${
                          currentLesson?.id === lesson.id && !showCertificateExam
                            ? "bg-primary/10 text-primary"
                            : isLocked ? "" : "hover:bg-muted"
                        }
                    `}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                            h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                            ${
                              completedLessons[lesson.id]
                                ? "bg-green-500 text-white"
                                : currentLesson?.id === lesson.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }
                          `}
                        >
                          {completedLessons[lesson.id] ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : lesson.lesson_type === "quiz" ? (
                            <ClipboardList className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium line-clamp-2 ${completedLessons[lesson.id] ? "text-green-600" : ""}`}>
                            {lesson.title}
                          </p>
                          {lesson.duration_minutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {lesson.duration_minutes} минут
                            </p>
                          )}
                        </div>
                        {isLocked && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                      </div>
                    </button>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
