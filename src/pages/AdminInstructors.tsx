import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import ImageUpload from "@/components/admin/ImageUpload";

interface Instructor {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  expertise: string[] | null;
  created_at: string;
}

interface FormData {
  name: string;
  bio: string;
  avatar_url: string;
  expertise: string;
}

const initialFormData: FormData = {
  name: "",
  bio: "",
  avatar_url: "",
  expertise: "",
};

const AdminInstructors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

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

    await fetchInstructors();
    setLoading(false);
  };

  const fetchInstructors = async () => {
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Багш нарыг татахад алдаа гарлаа");
    } else {
      setInstructors(data || []);
    }
  };

  const openAddDialog = () => {
    setEditingInstructor(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      name: instructor.name,
      bio: instructor.bio || "",
      avatar_url: instructor.avatar_url || "",
      expertise: instructor.expertise?.join(", ") || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Багшийн нэр оруулна уу");
      return;
    }

    setSaving(true);

    const expertiseArray = formData.expertise
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    try {
      if (editingInstructor) {
        const { error } = await supabase
          .from("instructors")
          .update({
            name: formData.name,
            bio: formData.bio || null,
            avatar_url: formData.avatar_url || null,
            expertise: expertiseArray.length > 0 ? expertiseArray : null,
          })
          .eq("id", editingInstructor.id);

        if (error) throw error;
        toast.success("Багш амжилттай шинэчлэгдлээ");
      } else {
        const { error } = await supabase.from("instructors").insert({
          name: formData.name,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
          expertise: expertiseArray.length > 0 ? expertiseArray : null,
        });

        if (error) throw error;
        toast.success("Багш амжилттай нэмэгдлээ");
      }

      setDialogOpen(false);
      fetchInstructors();
    } catch (error: any) {
      console.error("Error saving instructor:", error);
      toast.error(error.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const deleteInstructor = async (instructorId: string) => {
    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", instructorId);

      if (error) throw error;

      toast.success("Багш амжилттай устгагдлаа");
      fetchInstructors();
    } catch (error: any) {
      console.error("Error deleting instructor:", error);
      toast.error(error.message || "Устгахад алдаа гарлаа");
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
              <h1 className="text-2xl font-bold">Багш нар</h1>
              <p className="text-muted-foreground">
                Багш нарыг удирдах
              </p>
            </div>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Багш нэмэх
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {instructors.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Багш байхгүй байна</h3>
            <p className="text-muted-foreground mb-4">
              Эхний багшаа нэмнэ үү
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Багш нэмэх
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="bg-card rounded-xl shadow-card overflow-hidden"
              >
                <div className="aspect-[4/3] relative bg-muted">
                  {instructor.avatar_url ? (
                    <img
                      src={instructor.avatar_url}
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <User className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg">{instructor.name}</h3>
                  {instructor.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {instructor.bio}
                    </p>
                  )}
                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {instructor.expertise.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {instructor.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{instructor.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(instructor)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Засах
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Багш устгах уу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{instructor.name}" багшийг устгахдаа итгэлтэй байна уу?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Болих</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteInstructor(instructor.id)}
                          >
                            Устгах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingInstructor ? "Багш засах" : "Шинэ багш нэмэх"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Зураг</Label>
              <ImageUpload
                value={formData.avatar_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, avatar_url: url }))}
                bucket="instructor-avatars"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Нэр *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Багшийн нэр"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Танилцуулга</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Багшийн танилцуулга"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">Мэргэжил (таслалаар тусгаарлана)</Label>
              <Input
                id="expertise"
                value={formData.expertise}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expertise: e.target.value }))
                }
                placeholder="React, Node.js, Python"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Болих
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingInstructor ? "Хадгалах" : "Нэмэх"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstructors;
