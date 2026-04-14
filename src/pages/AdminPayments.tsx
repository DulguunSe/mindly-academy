import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

const AdminPayments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

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

    await fetchPurchases();
    setLoading(false);
  };

  const fetchPurchases = async () => {
    // Fetch courses first for title mapping
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, title");

    const { data: purchasesData, error } = await supabase
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

    if (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Төлбөрүүдийг татахад алдаа гарлаа");
    } else if (purchasesData && coursesData) {
      const purchasesWithDetails = purchasesData.map((purchase) => {
        const course = coursesData.find((c) => c.id === purchase.course_id);
        return {
          ...purchase,
          course_title: course?.title || "Тодорхойгүй",
        };
      });
      setPurchases(purchasesWithDetails);
    }
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
      fetchPurchases();
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
      fetchPurchases();
    }
  };

  const pendingPurchases = purchases.filter((p) => p.status === "pending");
  const completedPurchases = purchases.filter((p) => p.status === "completed");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <h1 className="text-2xl font-bold">Төлбөрүүд</h1>
              <p className="text-muted-foreground">
                Бүх төлбөрүүдийг удирдах
              </p>
            </div>
          </div>
          {pendingPurchases.length > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              {pendingPurchases.length} хүлээгдэж байна
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Хүлээгдэж буй
              {pendingPurchases.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingPurchases.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Баталгаажсан</TabsTrigger>
            <TabsTrigger value="all">Бүгд</TabsTrigger>
          </TabsList>

          {/* Pending Purchases */}
          <TabsContent value="pending">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сургалт</TableHead>
                    <TableHead>Дүн</TableHead>
                    <TableHead>Төлбөрийн ID</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead className="text-right">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPurchases.length > 0 ? (
                    pendingPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.course_title}
                        </TableCell>
                        <TableCell>{Number(purchase.amount).toLocaleString()}₮</TableCell>
                        <TableCell className="text-muted-foreground">
                          {purchase.payment_id || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(purchase.purchased_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => approvePurchase(purchase.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Батлах
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectPurchase(purchase.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Цуцлах
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Хүлээгдэж буй төлбөр байхгүй
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Completed Purchases */}
          <TabsContent value="completed">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сургалт</TableHead>
                    <TableHead>Дүн</TableHead>
                    <TableHead>Төлбөрийн ID</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPurchases.length > 0 ? (
                    completedPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.course_title}
                        </TableCell>
                        <TableCell>{Number(purchase.amount).toLocaleString()}₮</TableCell>
                        <TableCell className="text-muted-foreground">
                          {purchase.payment_id || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(purchase.purchased_at)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">Баталгаажсан</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Баталгаажсан төлбөр байхгүй
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* All Purchases */}
          <TabsContent value="all">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сургалт</TableHead>
                    <TableHead>Дүн</TableHead>
                    <TableHead>Төлбөрийн ID</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.course_title}
                        </TableCell>
                        <TableCell>{Number(purchase.amount).toLocaleString()}₮</TableCell>
                        <TableCell className="text-muted-foreground">
                          {purchase.payment_id || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(purchase.purchased_at)}
                        </TableCell>
                        <TableCell>
                          {purchase.status === "completed" ? (
                            <Badge className="bg-green-600">Баталгаажсан</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500 text-white">
                              Хүлээгдэж байна
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Төлбөр байхгүй
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
  );
};

export default AdminPayments;
