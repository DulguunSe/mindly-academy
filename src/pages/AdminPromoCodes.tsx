import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  CreditCard,
  Users,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

const AdminPromoCodes = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: 10,
    is_active: true,
    usage_limit: "",
    expires_at: "",
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
    await fetchPromoCodes();
    setLoading(false);
  };

  const fetchPromoCodes = async () => {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching promo codes:", error);
    } else {
      setPromoCodes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code.toUpperCase().trim(),
      discount_percent: formData.discount_percent,
      is_active: formData.is_active,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      expires_at: formData.expires_at || null,
    };

    if (editingCode) {
      const { error } = await supabase
        .from("promo_codes")
        .update(payload)
        .eq("id", editingCode.id);

      if (error) {
        toast.error("Алдаа гарлаа");
      } else {
        toast.success("Promo код шинэчлэгдлээ");
        setShowDialog(false);
        resetForm();
        fetchPromoCodes();
      }
    } else {
      const { error } = await supabase.from("promo_codes").insert(payload);

      if (error) {
        if (error.code === "23505") {
          toast.error("Энэ код аль хэдийн бүртгэгдсэн байна");
        } else {
          toast.error("Алдаа гарлаа");
        }
      } else {
        toast.success("Promo код үүсгэгдлээ");
        setShowDialog(false);
        resetForm();
        fetchPromoCodes();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_percent: 10,
      is_active: true,
      usage_limit: "",
      expires_at: "",
    });
    setEditingCode(null);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingCode(promo);
    setFormData({
      code: promo.code,
      discount_percent: promo.discount_percent,
      is_active: promo.is_active,
      usage_limit: promo.usage_limit?.toString() || "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    
    if (error) {
      toast.error("Устгахад алдаа гарлаа");
    } else {
      toast.success("Promo код устгагдлаа");
      fetchPromoCodes();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Алдаа гарлаа");
    } else {
      fetchPromoCodes();
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
            to="/admin/payments"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <CreditCard className="h-5 w-5" />
            Төлбөрүүд
          </Link>
          <Link
            to="/admin/promo-codes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground"
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
              <h1 className="text-2xl font-bold">Promo кодууд</h1>
              <p className="text-muted-foreground">Хөнгөлөлтийн кодуудаа удирдаарай</p>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Шинэ promo код
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCode ? "Promo код засах" : "Шинэ promo код үүсгэх"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Код</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="SUMMER2024"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Хөнгөлөлт (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                      required
                    />
                    {formData.discount_percent === 100 && (
                      <p className="text-sm text-green-600">100% хөнгөлөлт = Үнэгүй, автоматаар баталгаажна</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit">Ашиглах лимит (хоосон = хязгааргүй)</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="Хязгааргүй"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Дуусах огноо (хоосон = хугацаагүй)</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Идэвхтэй</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingCode ? "Хадгалах" : "Үүсгэх"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Хөнгөлөлт</TableHead>
                  <TableHead>Ашиглалт</TableHead>
                  <TableHead>Дуусах огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.length > 0 ? (
                  promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                      <TableCell>
                        <Badge variant={promo.discount_percent === 100 ? "default" : "secondary"}>
                          {promo.discount_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promo.used_count} / {promo.usage_limit || "∞"}
                      </TableCell>
                      <TableCell>
                        {promo.expires_at
                          ? new Date(promo.expires_at).toLocaleDateString("mn-MN")
                          : "Хугацаагүй"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={promo.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActive(promo.id, promo.is_active)}
                        >
                          {promo.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Идэвхтэй
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Идэвхгүй
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(promo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Promo код устгах уу?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{promo.code}" кодыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Болих</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(promo.id)}>
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
                      Promo код байхгүй байна
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

export default AdminPromoCodes;
