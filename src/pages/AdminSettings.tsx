import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "Mindly Academy",
  siteDescription: "Онлайн сургалтын платформ",
  contactEmail: "info@mindly.mn",
  contactPhone: "+976 9999 9999",
  bankName: "Хаан банк",
  bankAccount: "5406163083",
  bankAccountName: "Дөлгөөн",
  maintenanceMode: "false",
  allowRegistration: "true",
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
      return;
    }

    // Load settings from database
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (!error && data) {
      const dbSettings = { ...DEFAULT_SETTINGS };
      data.forEach((row: { key: string; value: string }) => {
        dbSettings[row.key] = row.value;
      });
      setSettings(dbSettings);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Upsert each setting
      const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));

      for (const item of upserts) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: item.value, updated_at: item.updated_at })
          .eq("key", item.key);

        if (error) {
          // If update fails (no row), try insert
          await supabase
            .from("site_settings")
            .insert(item);
        }
      }

      toast.success("Тохиргоо амжилттай хадгалагдлаа");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Тохиргоо хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: String(value) }));
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
              <h1 className="text-2xl font-bold">Тохиргоо</h1>
              <p className="text-muted-foreground">
                Сайтын ерөнхий тохиргоо
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Хадгалах
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* General Settings */}
        <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
          <h2 className="text-lg font-semibold">Ерөнхий мэдээлэл</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Сайтын нэр</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                placeholder="Сайтын нэр"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Холбоо барих имэйл</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="info@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Сайтын тайлбар</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
              placeholder="Сайтын богино тайлбар"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Холбоо барих утас</Label>
            <Input
              id="contactPhone"
              value={settings.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              placeholder="+976 9999 9999"
            />
          </div>
        </div>

        {/* Bank Settings */}
        <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
          <h2 className="text-lg font-semibold">Банкны мэдээлэл</h2>
          <p className="text-sm text-muted-foreground">
            Шилжүүлгийн мэдээлэлд харагдах банкны данс
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Банкны нэр</Label>
              <Input
                id="bankName"
                value={settings.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="Хаан банк"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Дансны дугаар</Label>
              <Input
                id="bankAccount"
                value={settings.bankAccount}
                onChange={(e) => handleChange("bankAccount", e.target.value)}
                placeholder="5406163083"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Данс эзэмшигч</Label>
              <Input
                id="bankAccountName"
                value={settings.bankAccountName}
                onChange={(e) => handleChange("bankAccountName", e.target.value)}
                placeholder="Нэр"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-card rounded-xl p-6 shadow-card space-y-6">
          <h2 className="text-lg font-semibold">Системийн тохиргоо</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <div className="font-medium">Бүртгэл нээлттэй</div>
                <div className="text-sm text-muted-foreground">
                  Шинэ хэрэглэгчид бүртгүүлэх боломжтой эсэх
                </div>
              </div>
              <Switch
                checked={settings.allowRegistration === "true"}
                onCheckedChange={(checked) => handleChange("allowRegistration", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <div>
                <div className="font-medium text-destructive">Засвар үйлчилгээний горим</div>
                <div className="text-sm text-muted-foreground">
                  Идэвхжүүлсэн үед хэрэглэгчид сайт руу нэвтрэх боломжгүй
                </div>
              </div>
              <Switch
                checked={settings.maintenanceMode === "true"}
                onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
