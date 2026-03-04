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
  DollarSign,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface CourseRevenue {
  course_id: string;
  course_title: string;
  category: string;
  price: number;
  total_sales: number;
  total_revenue: number;
  pending_sales: number;
  pending_revenue: number;
}

const categoryLabels: Record<string, string> = {
  web: "Веб хөгжүүлэлт",
  programming: "Програмчлал",
  ai: "AI сургалт",
};

const AdminCourseRevenue = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenue[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    pendingRevenue: 0,
  });

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
    await fetchCourseRevenue();
    setLoading(false);
  };

  const fetchCourseRevenue = async () => {
    // Get all courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, category, price")
      .order("title");

    if (!courses) return;

    // Get all purchases
    const { data: purchases } = await supabase
      .from("purchases")
      .select("course_id, amount, status");

    if (!purchases) {
      setCourseRevenue(courses.map(course => ({
        course_id: course.id,
        course_title: course.title,
        category: course.category,
        price: Number(course.price),
        total_sales: 0,
        total_revenue: 0,
        pending_sales: 0,
        pending_revenue: 0,
      })));
      return;
    }

    // Calculate revenue per course
    const revenueData = courses.map(course => {
      const coursePurchases = purchases.filter(p => p.course_id === course.id);
      const completedPurchases = coursePurchases.filter(p => p.status === "completed");
      const pendingPurchases = coursePurchases.filter(p => p.status === "pending");

      return {
        course_id: course.id,
        course_title: course.title,
        category: course.category,
        price: Number(course.price),
        total_sales: completedPurchases.length,
        total_revenue: completedPurchases.reduce((sum, p) => sum + Number(p.amount), 0),
        pending_sales: pendingPurchases.length,
        pending_revenue: pendingPurchases.reduce((sum, p) => sum + Number(p.amount), 0),
      };
    });

    // Sort by revenue descending
    revenueData.sort((a, b) => b.total_revenue - a.total_revenue);
    setCourseRevenue(revenueData);

    // Calculate totals
    setTotalStats({
      totalRevenue: revenueData.reduce((sum, c) => sum + c.total_revenue, 0),
      totalSales: revenueData.reduce((sum, c) => sum + c.total_sales, 0),
      pendingRevenue: revenueData.reduce((sum, c) => sum + c.pending_revenue, 0),
    });
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Eye className="h-5 w-5" />
            Хэрэглэгчийн явц
          </Link>
          <Link
            to="/admin/course-revenue"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <TrendingUp className="h-5 w-5" />
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
            <h1 className="text-2xl font-bold">Орлогын тайлан</h1>
            <p className="text-muted-foreground">
              Сургалт тус бүрээс олсон орлогыг хянах
            </p>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {totalStats.totalRevenue.toLocaleString()}₮
                  </div>
                  <div className="text-muted-foreground">Нийт орлого</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalStats.totalSales}</div>
                  <div className="text-muted-foreground">Нийт борлуулалт</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {totalStats.pendingRevenue.toLocaleString()}₮
                  </div>
                  <div className="text-muted-foreground">Хүлээгдэж буй</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Table */}
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Сургалт тус бүрийн орлого</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сургалт</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Борлуулалт</TableHead>
                  <TableHead>Орлого</TableHead>
                  <TableHead>Хүлээгдэж буй</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseRevenue.length > 0 ? (
                  courseRevenue.map((course) => (
                    <TableRow key={course.course_id}>
                      <TableCell className="font-medium">{course.course_title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryLabels[course.category] || course.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.price.toLocaleString()}₮</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{course.total_sales}</span>
                          <span className="text-muted-foreground text-sm">ширхэг</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {course.total_revenue.toLocaleString()}₮
                        </span>
                      </TableCell>
                      <TableCell>
                        {course.pending_sales > 0 ? (
                          <div className="text-amber-600 dark:text-amber-400">
                            <span className="font-medium">{course.pending_sales}</span>
                            <span className="text-sm ml-1">
                              ({course.pending_revenue.toLocaleString()}₮)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Сургалт байхгүй байна
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

export default AdminCourseRevenue;
