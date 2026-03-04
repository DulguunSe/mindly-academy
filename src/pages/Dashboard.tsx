import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, PlayCircle, Clock, GraduationCap, Loader2, CheckCircle2, User as UserIcon, Award, Download } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import CertificateGenerator from "@/components/course/CertificateGenerator";

interface PurchasedCourse {
  id: string;
  purchased_at: string;
  status: string | null;
  courses: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration_hours: number | null;
    lessons_count: number | null;
    category: string;
  };
}

interface CourseProgress {
  [courseId: string]: {
    completed: number;
    total: number;
  };
}

interface Certificate {
  id: string;
  course_id: string;
  recipient_name: string;
  score: number;
  total_questions: number;
  issued_at: string;
  courses: {
    title: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user?.id)
      .single();

    setProfile(profileData);

    // Fetch purchased courses
    const { data: purchasesData, error } = await supabase
      .from("purchases")
      .select(`
        id,
        purchased_at,
        status,
        courses (
          id,
          title,
          thumbnail_url,
          duration_hours,
          lessons_count,
          category
        )
      `)
      .eq("user_id", user?.id)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
    } else {
      setPurchasedCourses(purchasesData || []);

      // Fetch progress for each course
      if (purchasesData && purchasesData.length > 0) {
        const courseIds = purchasesData.map(p => p.courses.id);
        
        // Fetch total lessons count per course
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds);

        // Fetch completed lessons for user
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id, course_id, completed")
          .eq("user_id", user?.id)
          .eq("completed", true)
          .in("course_id", courseIds);

        // Calculate progress per course
        const progress: CourseProgress = {};
        courseIds.forEach(courseId => {
          const totalLessons = lessonsData?.filter(l => l.course_id === courseId).length || 0;
          const completedLessons = progressData?.filter(p => p.course_id === courseId).length || 0;
          progress[courseId] = {
            completed: completedLessons,
            total: totalLessons
          };
        });
        setCourseProgress(progress);
      }
    }

    // Fetch certificates
    const { data: certsData } = await supabase
      .from("certificates")
      .select("id, course_id, recipient_name, score, total_questions, issued_at, courses(title)")
      .eq("user_id", user?.id)
      .order("issued_at", { ascending: false });

    setCertificates(certsData as Certificate[] || []);

    setLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    web: "Веб хөгжүүлэлт",
    programming: "Програмчлал",
    ai: "AI сургалт",
  };

  return (
    <Layout>
      <div className="bg-primary py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">
                Сайн байна уу, {profile?.full_name || "Суралцагч"}!
              </h1>
              <p className="text-primary-foreground/80">
                Таны сургалтууд энд байна
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground rounded-lg transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              Профайл засах
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{purchasedCourses.length}</div>
                <div className="text-sm text-muted-foreground">Сургалтууд</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {purchasedCourses.reduce(
                    (acc, p) => acc + (p.courses.duration_hours || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Нийт цаг</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {purchasedCourses.reduce(
                    (acc, p) => acc + (p.courses.lessons_count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Нийт хичээл</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{certificates.length}</div>
                <div className="text-sm text-muted-foreground">Сертификат</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Миний сургалтууд</h2>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : purchasedCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedCourses.map((purchase) => {
                const isPending = purchase.status === "pending";
                const isCompleted = purchase.status === "completed";
                
                const CardWrapper = isPending ? "div" : Link;
                const cardProps = isPending 
                  ? { className: "group bg-card rounded-xl overflow-hidden shadow-card opacity-80" }
                  : { 
                      to: `/dashboard/courses/${purchase.courses.id}`,
                      className: "group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                    };

                return (
                  <CardWrapper key={purchase.id} {...cardProps as any}>
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {purchase.courses.thumbnail_url ? (
                        <img
                          src={purchase.courses.thumbnail_url}
                          alt={purchase.courses.title}
                          className={`w-full h-full object-cover ${!isPending ? "group-hover:scale-105" : ""} transition-transform duration-300`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <BookOpen className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      {isPending ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
                            <p className="text-sm font-medium">Баталгаажуулж байна</p>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <PlayCircle className="h-16 w-16 text-white" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {isPending ? (
                          <Badge variant="secondary" className="bg-yellow-500/90 text-white border-0">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Хүлээгдэж байна
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="secondary" className="bg-green-500/90 text-white border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Баталгаажсан
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-5">
                      <span className="text-xs text-muted-foreground">
                        {categoryLabels[purchase.courses.category] || purchase.courses.category}
                      </span>
                      <h3 className={`font-semibold text-lg mt-1 ${!isPending ? "group-hover:text-primary" : ""} transition-colors`}>
                        {purchase.courses.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{purchase.courses.duration_hours || 0} цаг</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{purchase.courses.lessons_count || 0} хичээл</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {isCompleted && courseProgress[purchase.courses.id] && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Явц</span>
                            <span className="font-medium">
                              {courseProgress[purchase.courses.id].total > 0
                                ? Math.round((courseProgress[purchase.courses.id].completed / courseProgress[purchase.courses.id].total) * 100)
                                : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={
                              courseProgress[purchase.courses.id].total > 0
                                ? (courseProgress[purchase.courses.id].completed / courseProgress[purchase.courses.id].total) * 100
                                : 0
                            } 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {courseProgress[purchase.courses.id].completed}/{courseProgress[purchase.courses.id].total} хичээл үзсэн
                          </p>
                        </div>
                      )}

                      {isPending && (
                        <p className="text-xs text-yellow-600 mt-3">
                          Админ таны төлбөрийг шалгаж баталгаажуулах хүртэл хүлээнэ үү
                        </p>
                      )}
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Сургалт байхгүй байна</h3>
              <p className="text-muted-foreground mb-4">
                Та одоогоор ямар ч сургалт худалдаж аваагүй байна
              </p>
              <Button asChild>
                <Link to="/courses">Сургалтууд үзэх</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Миний сертификатууд</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{cert.courses?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cert.recipient_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Оноо: {cert.score}/{cert.total_questions} ({Math.round((cert.score / cert.total_questions) * 100)}%)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(cert.issued_at).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 gap-2"
                    onClick={() => setSelectedCert(cert)}
                  >
                    <Download className="h-4 w-4" />
                    Сертификат татах
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Download Dialog */}
        {selectedCert && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCert(null)}>
            <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">{selectedCert.courses?.title} - Сертификат</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCert(null)}>✕</Button>
              </div>
              <CertificateGenerator
                recipientName={selectedCert.recipient_name}
                courseName={selectedCert.courses?.title || ""}
                issuedAt={selectedCert.issued_at}
                score={selectedCert.score}
                totalQuestions={selectedCert.total_questions}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
