import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Video,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Course {
  id: string;
  title: string;
  price: number;
  category: string;
  is_published: boolean;
  lessons_count: number | null;
  created_at: string;
  instructor_id: string | null;
  instructors?: { name: string } | null;
}

const categoryLabels: Record<string, string> = {
  web: "Веб хөгжүүлэлт",
  programming: "Програмчлал",
  ai: "AI сургалт",
  design: "Дизайн",
  business: "Бизнес",
};

const AdminCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

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

    await fetchCourses();
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        price,
        category,
        is_published,
        lessons_count,
        created_at,
        instructor_id,
        instructors (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
      toast.error("Сургалтуудыг татахад алдаа гарлаа");
    } else {
      setCourses(data || []);
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
      fetchCourses();
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await supabase.from("lessons").delete().eq("course_id", courseId);
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      
      if (error) throw error;
      
      toast.success("Сургалт амжилттай устгагдлаа");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error("Устгахад алдаа гарлаа");
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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Сургалтууд</h1>
              <p className="text-muted-foreground">
                Бүх сургалтуудыг удирдах
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/admin/courses/new">
              <Plus className="h-4 w-4 mr-2" />
              Шинэ сургалт
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Багш</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {course.instructors?.name || "-"}
                    </TableCell>
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
                                "{course.title}" сургалт болон түүний бүх хичээлүүд устгагдана.
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Сургалт байхгүй байна
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default AdminCourses;
