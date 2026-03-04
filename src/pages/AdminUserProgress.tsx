import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  CreditCard,
  Tag,
  Eye,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserProgress {
  user_id: string;
  user_email: string;
  user_name: string | null;
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  current_lesson_title: string | null;
  current_lesson_order: number | null;
  last_activity: string | null;
}

const AdminUserProgress = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);

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
      checkAdminAndFetch();
    }
  }, [user]);

  const checkAdminAndFetch = async () => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Админ эрхгүй байна");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await fetchUserProgress();
    setLoading(false);
  };

  const fetchUserProgress = async () => {
    // Get all purchases with completed status
    const { data: purchases } = await supabase
      .from("purchases")
      .select(`
        user_id,
        course_id,
        courses (
          id,
          title,
          lessons_count
        )
      `)
      .eq("status", "completed");

    if (!purchases) return;

    // Get profiles for user names
    const userIds = [...new Set(purchases.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    // Get lesson progress for each purchase
    const progressPromises = purchases.map(async (purchase) => {
      // Get user's progress in this course
      const { data: lessonProgress } = await supabase
        .from("lesson_progress")
        .select(`
          lesson_id,
          completed,
          last_watched_at,
          lessons (
            title,
            order_index
          )
        `)
        .eq("user_id", purchase.user_id)
        .eq("course_id", purchase.course_id)
        .order("last_watched_at", { ascending: false });

      // Get total lessons for this course
      const { count: totalLessons } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("course_id", purchase.course_id);

      const profile = profiles?.find(p => p.user_id === purchase.user_id);
      const currentLesson = lessonProgress?.[0];
      
      return {
        user_id: purchase.user_id,
        user_email: purchase.user_id, // We'll need to get this separately
        user_name: profile?.full_name || null,
        course_id: purchase.course_id,
        course_title: (purchase.courses as any)?.title || "Тодорхойгүй",
        total_lessons: totalLessons || (purchase.courses as any)?.lessons_count || 0,
        completed_lessons: lessonProgress?.filter(lp => lp.completed).length || 0,
        current_lesson_title: currentLesson?.lessons?.title || null,
        current_lesson_order: currentLesson?.lessons?.order_index !== undefined 
          ? currentLesson.lessons.order_index + 1 
          : null,
        last_activity: currentLesson?.last_watched_at || null,
      };
    });

    const progressData = await Promise.all(progressPromises);
    setUserProgress(progressData.sort((a, b) => {
      if (!a.last_activity) return 1;
      if (!b.last_activity) return -1;
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground hidden lg:flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Mindly Academy" className="h-12 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            Хяналтын самбар
          </Link>
          <Link
            to="/admin/courses"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <GraduationCap className="h-5 w-5" />
            Сургалтууд
          </Link>
          <Link
            to="/admin/user-progress"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Eye className="h-5 w-5" />
            Хэрэглэгчийн явц
          </Link>
          <Link
            to="/admin/course-revenue"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <CreditCard className="h-5 w-5" />
            Орлогын тайлан
          </Link>
          <Link
            to="/admin/payments"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <CreditCard className="h-5 w-5" />
            Төлбөрүүд
          </Link>
          <Link
            to="/admin/promo-codes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Tag className="h-5 w-5" />
            Promo кодууд
          </Link>
          <Link
            to="/admin/instructors"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Users className="h-5 w-5" />
            Багш нар
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="h-5 w-5" />
            Тохиргоо
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-sidebar-accent transition-colors text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Гарах
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Хэрэглэгчийн явц</h1>
            <p className="text-muted-foreground">
              Хэрэглэгчид аль сургалтын хэддэх хичээл дээр явж байгааг хянах
            </p>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Хэрэглэгч</TableHead>
                  <TableHead>Сургалт</TableHead>
                  <TableHead>Одоогийн хичээл</TableHead>
                  <TableHead>Явц</TableHead>
                  <TableHead>Сүүлийн идэвхи</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProgress.length > 0 ? (
                  userProgress.map((progress, index) => (
                    <TableRow key={`${progress.user_id}-${progress.course_id}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{progress.user_name || "Нэргүй"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {progress.course_title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {progress.current_lesson_title ? (
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-primary" />
                            <span>
                              #{progress.current_lesson_order} {progress.current_lesson_title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Эхлээгүй</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={progress.total_lessons > 0 
                              ? (progress.completed_lessons / progress.total_lessons) * 100 
                              : 0
                            } 
                            className="w-20 h-2"
                          />
                          <span className="text-sm text-muted-foreground">
                            {progress.completed_lessons}/{progress.total_lessons}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {progress.last_activity ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(progress.last_activity).toLocaleDateString("mn-MN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Хэрэглэгчийн явцын мэдээлэл байхгүй байна
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUserProgress;
