import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";
import logo from "@/assets/mindly-logo.png";

const emailLoginSchema = z.object({
  email: z.string().email("Зөв имэйл хаяг оруулна уу"),
  password: z.string().min(6, "Нууц үг 6-с дээш тэмдэгт байх ёстой"),
});

const emailRegisterSchema = emailLoginSchema.extend({
  fullName: z.string().min(2, "Нэр 2-с дээш тэмдэгт байх ёстой"),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(8, "Зөв утасны дугаар оруулна уу").max(15),
  password: z.string().min(6, "Нууц үг 6-с дээш тэмдэгт байх ёстой"),
});

const phoneRegisterSchema = phoneLoginSchema.extend({
  fullName: z.string().min(2, "Нэр 2-с дээш тэмдэгт байх ёстой"),
});

const phoneToEmail = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("976") ? cleaned : `976${cleaned}`;
  return `phone_${number}@mindly.local`;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (authMethod === "email") {
        const schema = isLogin ? emailLoginSchema : emailRegisterSchema;
        const result = schema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (error) {
            toast.error(error.message.includes("Invalid login credentials")
              ? "Имэйл эсвэл нууц үг буруу байна"
              : error.message);
            setLoading(false);
            return;
          }
          toast.success("Амжилттай нэвтэрлээ!");
        } else {
          const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: { full_name: formData.fullName },
            },
          });
          if (error) {
            toast.error(error.message.includes("User already registered")
              ? "Энэ имэйл хаягаар бүртгэгдсэн хэрэглэгч байна"
              : error.message);
            setLoading(false);
            return;
          }
          toast.success("Амжилттай бүртгэгдлээ!");
        }
      } else {
        // Phone auth via internal email
        const schema = isLogin ? phoneLoginSchema : phoneRegisterSchema;
        const result = schema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const internalEmail = phoneToEmail(formData.phone);

        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({
            email: internalEmail,
            password: formData.password,
          });
          if (error) {
            toast.error(error.message.includes("Invalid login credentials")
              ? "Утасны дугаар эсвэл нууц үг буруу байна"
              : error.message);
            setLoading(false);
            return;
          }
          toast.success("Амжилттай нэвтэрлээ!");
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: internalEmail,
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName,
                phone_number: formData.phone,
              },
            },
          });
          if (error) {
            toast.error(error.message.includes("User already registered")
              ? "Энэ дугаараар бүртгэгдсэн хэрэглэгч байна"
              : error.message);
            setLoading(false);
            return;
          }

          // Update profile with phone number
          if (data.user) {
            await supabase
              .from("profiles")
              .update({ phone_number: formData.phone })
              .eq("user_id", data.user.id);
          }

          toast.success("Амжилттай бүртгэгдлээ!");
        }
      }

      navigate("/dashboard");
    } catch (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error("Google-ээр нэвтрэхэд алдаа гарлаа");
      }
    } catch (error) {
      toast.error("Google-ээр нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block mb-8">
              <img src={logo} alt="Mindly Academy" className="h-16 w-auto" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Тавтай морил!" : "Бүртгүүлэх"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Өөрийн бүртгэлд нэвтрэнэ үү"
                : "Шинэ бүртгэл үүсгэнэ үү"}
            </p>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google-ээр нэвтрэх
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Эсвэл</span>
            </div>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => { setAuthMethod("email"); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                authMethod === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-4 w-4" />
              Имэйл
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod("phone"); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                authMethod === "phone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-4 w-4" />
              Утас
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Бүтэн нэр</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Таны нэр"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            {authMethod === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Имэйл хаяг</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Утасны дугаар</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9912 3456"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Бүртгэл байхгүй юу?" : "Аль хэдийн бүртгэлтэй юу?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Бүртгүүлэх" : "Нэвтрэх"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Мэргэжлийн ур чадвараа хөгжүүл
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Монголын шилдэг багш нартай хамтран суралц
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
