import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  Plus,
  Pencil,
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Video,
  Tag,
  BookOpen,
  Eye,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  price: number;
  category: string;
  is_published: boolean;
  lessons_count: number | null;
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string | null;
  payment_id: string | null;
  status: string | null;
  purchased_at: string;
  course_title?: string;
  user_email?: string;
}

interface Stats {
  totalCourses: number;
  totalPurchases: number;
  totalRevenue: number;
  pendingPurchases: number;
}

const categoryLabels: Record<string, string> = {
  web: "Веб хөгжүүлэлт",
  programming: "Програмчлал",
  ai: "AI сургалт",
};

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    pendingPurchases: 0,
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
    // Check admin role
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
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    // Fetch courses
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, title, price, category, is_published, lessons_count, created_at")
      .order("created_at", { ascending: false });

    setCourses(coursesData || []);

    // Fetch all purchases with course info
    const { data: purchasesData } = await supabase
      .from("purchases")
      .select(`
        id,
        user_id,
        course_id,
        amount,
        payment_method,
        payment_id,
        status,
        purchased_at
      `)
      .order("purchased_at", { ascending: false });

    // Get course titles for purchases
    if (purchasesData && coursesData) {
      const purchasesWithDetails = purchasesData.map((purchase) => {
        const course = coursesData.find((c) => c.id === purchase.course_id);
        return {
          ...purchase,
          course_title: course?.title || "Тодорхойгүй",
        };
      });
      setPurchases(purchasesWithDetails);
    }

    // Fetch stats
    const { count: totalCourses } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    const completedPurchases = purchasesData?.filter(p => p.status === "completed") || [];
    const pendingPurchases = purchasesData?.filter(p => p.status === "pending") || [];
    
    const totalRevenue = completedPurchases.reduce(
      (acc, p) => acc + Number(p.amount),
      0
    );

    setStats({
      totalCourses: totalCourses || 0,
      totalPurchases: completedPurchases.length,
      totalRevenue,
      pendingPurchases: pendingPurchases.length,
    });
  };

  const approvePurchase = async (purchaseId: string) => {
    const { error } = await supabase
      .from("purchases")
      .update({ status: "completed" })
      .eq("id", purchaseId);

    if (error) {
      toast.error("Алдаа гарлаа");
    } else {
      toast.success("Төлбөр баталгаажлаа");
      fetchData();
    }
  };

  const rejectPurchase = async (purchaseId: string) => {
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchaseId);

    if (error) {
      toast.error("Алдаа гарлаа");
    } else {
      toast.success("Төлбөр цуцлагдлаа");
      fetchData();
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !currentStatus })
      .eq("id", courseId);

    if (error) {
      toast.error("Алдаа гарлаа");
    } else {
      toast.success(currentStatus ? "Нийтлэлийг болиулсан" : "Амжилттай нийтлэлээ");
      fetchData();
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      // First delete related lessons
      await supabase.from("lessons").delete().eq("course_id", courseId);
      
      // Then delete the course
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      
      if (error) throw error;
      
      toast.success("Сургалт амжилттай устгагдлаа");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error("Устгахад алдаа гарлаа");
    }
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground"
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
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
            {stats.pendingPurchases > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {stats.pendingPurchases}
              </Badge>
            )}
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Хяналтын самбар</h1>
              <p className="text-muted-foreground">Сургалтуудаа удирдаарай</p>
            </div>
            <Button asChild>
              <Link to="/admin/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                Шинэ сургалт
              </Link>
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.totalCourses}</div>
                  <div className="text-muted-foreground">Нийт сургалт</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.totalPurchases}</div>
                  <div className="text-muted-foreground">Нийт борлуулалт</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {stats.totalRevenue.toLocaleString()}₮
                  </div>
                  <div className="text-muted-foreground">Нийт орлого</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.pendingPurchases}</div>
                  <div className="text-muted-foreground">Хүлээгдэж буй</div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">Сургалтууд</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Хүлээгдэж буй төлбөр
                {stats.pendingPurchases > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {stats.pendingPurchases}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all-purchases">Бүх төлбөр</TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold">Сургалтууд</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Нэр</TableHead>
                      <TableHead>Ангилал</TableHead>
                      <TableHead>Үнэ</TableHead>
                      <TableHead>Хичээл</TableHead>
                      <TableHead>Төлөв</TableHead>
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            {categoryLabels[course.category] || course.category}
                          </TableCell>
                          <TableCell>{Number(course.price).toLocaleString()}₮</TableCell>
                          <TableCell>{course.lessons_count || 0}</TableCell>
                          <TableCell>
                            <Badge
                              variant={course.is_published ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => togglePublish(course.id, course.is_published)}
                            >
                              {course.is_published ? "Нийтлэгдсэн" : "Ноорог"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild title="Хичээлүүд">
                                <Link to={`/admin/courses/${course.id}/lessons`}>
                                  <Video className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title="Засах">
                                <Link to={`/admin/courses/${course.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Сургалт устгах уу?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{course.title}" сургалт болон түүний бүх хичээлүүд устгагдана. Энэ үйлдлийг буцаах боломжгүй.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Болих</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteCourse(course.id)}>
                                      Устгах
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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
            </TabsContent>

            {/* Pending Purchases Tab */}
            <TabsContent value="pending">
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold">Хүлээгдэж буй төлбөрүүд</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Дансаар шилжүүлэг хийсэн хэрэглэгчдийн төлбөрийг баталгаажуулна уу
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Сургалт</TableHead>
                      <TableHead>Дүн</TableHead>
                      <TableHead>Гүйлгээний дугаар</TableHead>
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.filter(p => p.status === "pending").length > 0 ? (
                      purchases
                        .filter((p) => p.status === "pending")
                        .map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              {new Date(purchase.purchased_at).toLocaleDateString("mn-MN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {purchase.course_title}
                            </TableCell>
                            <TableCell>{Number(purchase.amount).toLocaleString()}₮</TableCell>
                            <TableCell>
                              <code className="px-2 py-1 bg-muted rounded text-sm">
                                {purchase.payment_id || "—"}
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approvePurchase(purchase.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Батлах
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectPurchase(purchase.id)}
                                  className="gap-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Цуцлах
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Хүлээгдэж буй төлбөр байхгүй байна
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* All Purchases Tab */}
            <TabsContent value="all-purchases">
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold">Бүх төлбөрийн түүх</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Сургалт</TableHead>
                      <TableHead>Дүн</TableHead>
                      <TableHead>Төлбөрийн хэлбэр</TableHead>
                      <TableHead>Төлөв</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length > 0 ? (
                      purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            {new Date(purchase.purchased_at).toLocaleDateString("mn-MN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {purchase.course_title}
                          </TableCell>
                          <TableCell>{Number(purchase.amount).toLocaleString()}₮</TableCell>
                          <TableCell>
                            {purchase.payment_method === "bank_transfer"
                              ? "Дансаар"
                              : purchase.payment_method || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                purchase.status === "completed"
                                  ? "default"
                                  : purchase.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {purchase.status === "completed"
                                ? "Баталгаажсан"
                                : purchase.status === "pending"
                                ? "Хүлээгдэж буй"
                                : purchase.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Төлбөр байхгүй байна
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Admin;
