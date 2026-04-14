import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Clock,
  BookOpen,
  User,
  Award,
  PlayCircle,
  Lock,
  CheckCircle,
  Building2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import BankTransferDialog from "@/components/courses/BankTransferDialog";

interface Course {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  is_free?: boolean;
  thumbnail_url: string | null;
  duration_hours: number | null;
  lessons_count: number | null;
  level: string | null;
  category: string;
  instructors: {
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    expertise: string[] | null;
  } | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_preview: boolean;
}

const levelLabels: Record<string, string> = {
  beginner: "Анхан шат",
  intermediate: "Дунд шат",
  advanced: "Ахисан шат",
};

const categoryLabels: Record<string, string> = {
  web: "Веб хөгжүүлэлт",
  programming: "Програмчлал",
  ai: "AI сургалт",
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasPendingPurchase, setHasPendingPurchase] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchLessons();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkPurchase();
    }
  }, [user, id]);

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        id,
        title,
        description,
        short_description,
        price,
        thumbnail_url,
        duration_hours,
        lessons_count,
        level,
        category,
        instructors (id, name, bio, avatar_url, expertise)
      `,
      )
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error("Error fetching course:", error);
      navigate("/courses");
    } else if (data) {
      const courseData = { ...data, is_free: Number(data.price) === 0 };
      setCourse(courseData);
    }
    setLoading(false);
  };

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, description, duration_minutes, order_index, is_preview")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching lessons:", error);
    } else {
      setLessons(data || []);
    }
  };

  const checkPurchase = async () => {
    const { data } = await supabase
      .from("purchases")
      .select("id, status")
      .eq("user_id", user?.id)
      .eq("course_id", id)
      .maybeSingle();

    if (data) {
      if (data.status === "completed") {
        setHasPurchased(true);
        setHasPendingPurchase(false);
      } else if (data.status === "pending") {
        setHasPurchased(false);
        setHasPendingPurchase(true);
      }
    } else {
      setHasPurchased(false);
      setHasPendingPurchase(false);
    }
  };

  const handleBankTransfer = () => {
    if (!user) {
      toast.error("Худалдан авахын тулд нэвтэрнэ үү");
      navigate("/auth");
      return;
    }
    setShowBankDialog(true);
  };

  const handleEnrollFree = async () => {
    if (!user) {
      toast.error("Үзэхийн тулд нэвтэрнэ үү");
      navigate("/auth");
      return;
    }
    if (!course) return;

    setPurchasing(true);
    try {
      const { error } = await supabase.from("purchases").insert({
        user_id: user.id,
        course_id: course.id,
        amount: 0,
        payment_method: "free",
        payment_id: "free",
        status: "completed",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Та энэ сургалтыг аль хэдийн авсан байна");
        } else {
          throw error;
        }
      } else {
        toast.success("Сургалт амжилттай нээгдлээ!");
        setHasPurchased(true);
      }
    } catch (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubmitBankTransfer = async (
    transactionId: string, 
    promoCodeId: string | null, 
    finalAmount: number, 
    isFree: boolean
  ) => {
    if (!user || !course) return;

    setPurchasing(true);

    try {
      // If 100% discount (free), auto-complete the purchase
      const status = isFree ? "completed" : "pending";

      const { error } = await supabase.from("purchases").insert({
        user_id: user.id,
        course_id: course.id,
        amount: finalAmount,
        payment_method: isFree ? "promo_code" : "bank_transfer",
        payment_id: transactionId,
        status,
        promo_code_id: promoCodeId,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Та энэ сургалтын төлбөрийг аль хэдийн илгээсэн байна");
        } else {
          throw error;
        }
      } else {
        // Update promo code usage count if used
        if (promoCodeId) {
          const { data: promoData } = await supabase
            .from("promo_codes")
            .select("used_count")
            .eq("id", promoCodeId)
            .single();
          
          if (promoData) {
            await supabase
              .from("promo_codes")
              .update({ used_count: (promoData.used_count || 0) + 1 })
              .eq("id", promoCodeId);
          }
        }

        if (isFree) {
          toast.success("Сургалт амжилттай нээгдлээ! Одоо үзэж эхлээрэй.");
          setHasPurchased(true);
        } else {
          toast.success("Төлбөрийн хүсэлт амжилттай илгээгдлээ! Баталгаажуулсны дараа таны хандах эрх нээгдэнэ.");
          setHasPendingPurchase(true);
        }
        setShowBankDialog(false);
      }
    } catch (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Сургалт олдсонгүй</h1>
          <Button asChild>
            <Link to="/courses">Сургалтууд руу буцах</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary py-8">
        <div className="container">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Сургалтууд руу буцах
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-accent text-accent-foreground">
              {categoryLabels[course.category] || course.category}
            </Badge>
            <Badge variant="secondary">{levelLabels[course.level || "beginner"]}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">{course.title}</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Thumbnail */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <PlayCircle className="h-20 w-20 text-primary/40" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Сургалтын тухай</h2>
              </div>
              {course.short_description && course.description && (
                <p className="text-lg text-foreground/80 font-medium mb-4 pb-4 border-b border-border">
                  {course.short_description}
                </p>
              )}
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {(course.description || course.short_description || "Тайлбар байхгүй")
                  .split('\n\n')
                  .map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-4" : ""}>
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Instructor */}
            {course.instructors && (
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-xl font-bold mb-4">Багш</h2>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {course.instructors.avatar_url ? (
                      <img
                        src={course.instructors.avatar_url}
                        alt={course.instructors.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{course.instructors.name}</h3>
                    {course.instructors.expertise && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {course.instructors.expertise.map((exp) => (
                          <Badge key={exp} variant="secondary" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {course.instructors.bio && <p className="text-muted-foreground mt-2">{course.instructors.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Lessons List */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Хичээлүүд</h2>
              <div className="space-y-2">
                {lessons.length > 0 ? (
                  lessons.map((lesson, index) => {
                    const isClickable = lesson.is_preview || hasPurchased;
                    const Wrapper = isClickable ? Link : 'div';
                    const wrapperProps = isClickable ? { to: lesson.is_preview && !hasPurchased ? `/dashboard/courses/${course.id}?preview=${lesson.id}` : `/dashboard/courses/${course.id}` } : {};
                    return (
                      <Wrapper key={lesson.id} {...wrapperProps as any} className={`flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm ${isClickable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.duration_minutes && (
                            <span className="text-sm text-muted-foreground">{lesson.duration_minutes} минут</span>
                          )}
                        </div>
                        {lesson.is_preview ? (
                          <Badge variant="secondary" className="gap-1 text-green-600">
                            <PlayCircle className="h-3 w-3" />
                            Үнэгүй үзэх
                          </Badge>
                        ) : hasPurchased ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Wrapper>
                    );
                  })

                ) : (
                  <p className="text-muted-foreground text-center py-8">Хичээл байхгүй байна</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-xl p-6 shadow-card space-y-6">
              <div className="text-center">
                {course.is_free ? (
                  <div className="text-4xl font-bold text-green-600 mb-2">Үнэгүй</div>
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">{Number(course.price).toLocaleString()}₮</div>
                )}
              </div>

              {hasPurchased ? (
                <Button size="lg" className="w-full" asChild>
                  <Link to={`/dashboard/courses/${course.id}`}>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Хичээл үзэх
                  </Link>
                </Button>
              ) : hasPendingPurchase ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Таны төлбөр баталгаажуулалтын хүлээгдэж байна
                    </p>
                  </div>
                  <Button size="lg" className="w-full" variant="outline" disabled>
                    <Clock className="h-5 w-5 mr-2" />
                    Хүлээгдэж байна
                  </Button>
                </div>
              ) : course.is_free ? (
                <Button variant="hero" size="lg" className="w-full" onClick={handleEnrollFree} disabled={purchasing}>
                  {purchasing ? <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" /> : <PlayCircle className="h-5 w-5 mr-2" />}
                  Үнэгүй үзэх
                </Button>
              ) : (
                <Button variant="hero" size="lg" className="w-full" onClick={handleBankTransfer}>
                  <Building2 className="h-5 w-5 mr-2" />
                  Худалдаж авах
                </Button>
              )}

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{course.duration_hours || 0} цаг видео</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{course.lessons_count || lessons.length} хичээл</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Сертификат олгоно</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Насан туршид хандах эрхтэй</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {course && (
        <BankTransferDialog
          open={showBankDialog}
          onOpenChange={setShowBankDialog}
          courseTitle={course.title}
          price={Number(course.price)}
          onSubmit={handleSubmitBankTransfer}
          isSubmitting={purchasing}
        />
      )}
    </Layout>
  );
};

export default CourseDetail;
