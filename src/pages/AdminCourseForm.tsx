import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "ielts", label: "IELTS" },
  { id: "programming", label: "Програмчлал" },
  { id: "sat", label: "SAT" },
];

interface Instructor {
  id: string;
  name: string;
}

interface CourseFormData {
  title: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration_hours: number;
  thumbnail_url: string;
  is_published: boolean;
  instructor_id: string;
}

const initialFormData: CourseFormData = {
  title: "",
  short_description: "",
  description: "",
  price: 0,
  category: "programming",
  level: "beginner",
  duration_hours: 0,
  thumbnail_url: "",
  is_published: false,
  instructor_id: "",
};

const AdminCourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchInstructors();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchCourse(id);
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const fetchInstructors = async () => {
    const { data } = await supabase
      .from("instructors")
      .select("id, name")
      .order("name");
    setInstructors(data || []);
  };

  const fetchCategories = async () => {
    // Fetch unique categories from existing courses
    const { data } = await supabase
      .from("courses")
      .select("category");
    
    if (data) {
      const uniqueCategories = [...new Set(data.map(c => c.category))];
      const existingIds = DEFAULT_CATEGORIES.map(c => c.id);
      
      // Add any categories from database that aren't in defaults
      const additionalCategories = uniqueCategories
        .filter(cat => !existingIds.includes(cat))
        .map(cat => ({ id: cat, label: cat }));
      
      setCategories([...DEFAULT_CATEGORIES, ...additionalCategories]);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryId.trim() || !newCategoryLabel.trim()) {
      toast.error("Ангиллын ID болон нэр оруулна уу");
      return;
    }
    
    const categoryId = newCategoryId.toLowerCase().replace(/\s+/g, "_");
    
    if (categories.some(c => c.id === categoryId)) {
      toast.error("Энэ ID-тай ангилал аль хэдийн байна");
      return;
    }
    
    setCategories([...categories, { id: categoryId, label: newCategoryLabel }]);
    handleChange("category", categoryId);
    setNewCategoryId("");
    setNewCategoryLabel("");
    setShowAddCategory(false);
    toast.success("Шинэ ангилал нэмэгдлээ");
  };

  const checkAdminAccess = async () => {
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
    }
  };

  const fetchCourse = async (courseId: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error || !data) {
      toast.error("Сургалт олдсонгүй");
      navigate("/admin");
      return;
    }

    setFormData({
      title: data.title || "",
      short_description: data.short_description || "",
      description: data.description || "",
      price: data.price || 0,
      category: data.category || "programming",
      level: data.level || "beginner",
      duration_hours: data.duration_hours || 0,
      thumbnail_url: data.thumbnail_url || "",
      is_published: data.is_published || false,
      instructor_id: data.instructor_id || "",
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Сургалтын нэр оруулна уу");
      return;
    }

    setSaving(true);

    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from("courses")
          .update({
            title: formData.title,
            short_description: formData.short_description,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            level: formData.level,
            duration_hours: formData.duration_hours,
            thumbnail_url: formData.thumbnail_url || null,
            is_published: formData.is_published,
            instructor_id: formData.instructor_id || null,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Сургалт амжилттай шинэчлэгдлээ");
      } else {
        const { error } = await supabase.from("courses").insert({
          title: formData.title,
          short_description: formData.short_description,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          level: formData.level,
          duration_hours: formData.duration_hours,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          instructor_id: formData.instructor_id || null,
        });

        if (error) throw error;
        toast.success("Сургалт амжилттай үүсгэгдлээ");
      }

      navigate("/admin");
    } catch (error: any) {
      console.error("Error saving course:", error);
      toast.error(error.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    
    try {
      // First delete related lessons
      await supabase.from("lessons").delete().eq("course_id", id);
      
      // Then delete the course
      const { error } = await supabase.from("courses").delete().eq("id", id);
      
      if (error) throw error;
      
      toast.success("Сургалт амжилттай устгагдлаа");
      navigate("/admin");
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (field: keyof CourseFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              <h1 className="text-2xl font-bold">
                {isEditing ? "Сургалт засах" : "Шинэ сургалт"}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? "Сургалтын мэдээллийг засна уу" : "Шинэ сургалт үүсгэнэ үү"}
              </p>
            </div>
          </div>
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Устгах
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сургалт устгах уу?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Энэ үйлдлийг буцаах боломжгүй. Сургалт болон түүний бүх хичээлүүд устгагдана.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Болих</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Устгах
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
            <h2 className="text-lg font-semibold">Үндсэн мэдээлэл</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Сургалтын нэр *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Сургалтын нэрийг оруулна уу"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Богино тайлбар</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleChange("short_description", e.target.value)}
                  placeholder="Сургалтын богино тайлбар"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Дэлгэрэнгүй тайлбар</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Сургалтын дэлгэрэнгүй тайлбар"
                  rows={5}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
            <h2 className="text-lg font-semibold">Нэмэлт мэдээлэл</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Ангилал</Label>
                  <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Шинэ ангилал
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Шинэ ангилал нэмэх</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="newCategoryId">Ангиллын ID (англиар)</Label>
                          <Input
                            id="newCategoryId"
                            value={newCategoryId}
                            onChange={(e) => setNewCategoryId(e.target.value)}
                            placeholder="Жишээ: toefl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCategoryLabel">Ангиллын нэр</Label>
                          <Input
                            id="newCategoryLabel"
                            value={newCategoryLabel}
                            onChange={(e) => setNewCategoryLabel(e.target.value)}
                            placeholder="Жишээ: TOEFL"
                          />
                        </div>
                        <Button onClick={handleAddCategory} className="w-full">
                          Нэмэх
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ангилал сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Түвшин</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Түвшин сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Анхан шат</SelectItem>
                    <SelectItem value="intermediate">Дунд шат</SelectItem>
                    <SelectItem value="advanced">Ахисан шат</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Багш</Label>
                <Select
                  value={formData.instructor_id || "none"}
                  onValueChange={(value) => handleChange("instructor_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Багш сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Сонгоогүй</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Үнэ (₮)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) => handleChange("price", Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_hours">Үргэлжлэх хугацаа (цаг)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min={0}
                  value={formData.duration_hours}
                  onChange={(e) => handleChange("duration_hours", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Сургалтын зураг</Label>
              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => handleChange("thumbnail_url", url)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to="/admin">Болих</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Хадгалах" : "Үүсгэх"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminCourseForm;
