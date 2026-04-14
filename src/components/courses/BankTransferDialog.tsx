import { useState, useEffect } from "react";
import { Copy, Check, Building2, Tag, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
}

interface BankTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  price: number;
  onSubmit: (transferCode: string, promoCodeId: string | null, finalAmount: number, isFree: boolean) => Promise<void>;
  isSubmitting: boolean;
}

const generateTransferCode = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

const DEFAULT_BANK = {
  bankName: "Хаан Банк",
  accountNumber: "5406163083",
  accountName: "Дөлгөөн"
};

const BankTransferDialog = ({
  open,
  onOpenChange,
  courseTitle,
  price,
  onSubmit,
  isSubmitting
}: BankTransferDialogProps) => {
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK);
  const [confirmed, setConfirmed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transferCode] = useState(() => generateTransferCode());
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch bank details from database
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["bankName", "bankAccount", "bankAccountName"])
        .then(({ data }) => {
          if (data && data.length > 0) {
            const details = { ...DEFAULT_BANK };
            data.forEach((row: { key: string; value: string }) => {
              if (row.key === "bankName") details.bankName = row.value;
              if (row.key === "bankAccount") details.accountNumber = row.value;
              if (row.key === "bankAccountName") details.accountName = row.value;
            });
            setBankDetails(details);
          }
        });
    } else {
      setPromoCodeInput("");
      setAppliedPromo(null);
      setConfirmed(false);
    }
  }, [open]);

  const discountAmount = appliedPromo
    ? Math.round(price * appliedPromo.discount_percent / 100)
    : 0;
  const finalPrice = price - discountAmount;
  const isFree = finalPrice === 0;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Хуулагдлаа");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Хуулахад алдаа гарлаа");
    }
  };

  const checkPromoCode = async () => {
    if (!promoCodeInput.trim()) return;

    setCheckingPromo(true);
    try {
      const { data, error } = await supabase.
      from("promo_codes").
      select("id, code, discount_percent, usage_limit, used_count").
      eq("code", promoCodeInput.toUpperCase().trim()).
      eq("is_active", true).
      maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Буруу эсвэл идэвхгүй promo код");
        return;
      }

      // Check usage limit
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast.error("Энэ promo код хязгаартаа хүрсэн байна");
        return;
      }

      setAppliedPromo({
        id: data.id,
        code: data.code,
        discount_percent: data.discount_percent
      });
      setPromoCodeInput("");
      toast.success(`${data.discount_percent}% хөнгөлөлт амжилттай хэрэгжлээ!`);
    } catch (error) {
      console.error("Error checking promo code:", error);
      toast.error("Promo код шалгахад алдаа гарлаа");
    } finally {
      setCheckingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFree && !confirmed) {
      toast.error("Төлбөр шилжүүлсэн гэдгээ баталгаажуулна уу");
      return;
    }

    await onSubmit(transferCode, appliedPromo?.id || null, finalPrice, isFree);
    setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isFree ? "Үнэгүй авах" : "Дансаар шилжүүлэх"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Course Info - Compact */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Сургалт</p>
                <p className="font-medium text-sm line-clamp-1">{courseTitle}</p>
              </div>
            </div>
            
            {/* Price breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Үндсэн үнэ:</span>
                <span className={appliedPromo ? "line-through text-muted-foreground" : "font-bold text-primary"}>
                  {price.toLocaleString()}₮
                </span>
              </div>
              {appliedPromo &&
              <>
                  <div className="flex justify-between text-green-600">
                    <span>Хөнгөлөлт ({appliedPromo.discount_percent}%):</span>
                    <span>-{discountAmount.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-1 border-t border-border">
                    <span>Нийт:</span>
                    <span className="text-primary">
                      {isFree ? "Үнэгүй" : `${finalPrice.toLocaleString()}₮`}
                    </span>
                  </div>
                </>
              }
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="space-y-2">
            {appliedPromo ?
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="font-mono font-bold text-green-700 dark:text-green-400">
                    {appliedPromo.code}
                  </span>
                  <span className="text-sm text-green-600">
                    (-{appliedPromo.discount_percent}%)
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removePromo}>
                  <X className="h-4 w-4" />
                </Button>
              </div> :

            <div className="flex gap-2">
                <Input
                placeholder="Promo код оруулах"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className="font-mono uppercase" />
              
                <Button
                type="button"
                variant="outline"
                onClick={checkPromoCode}
                disabled={checkingPromo || !promoCodeInput.trim()}>
                
                  {checkingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Шалгах"}
                </Button>
              </div>
            }
          </div>

          {/* Bank Details - Only show if not free */}
          {!isFree &&
          <>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-card border rounded-lg">
                  <p className="text-xs text-muted-foreground">Банк</p>
                  <p className="font-medium text-sm">{bankDetails.bankName}</p>
                </div>
                <div className="p-2 bg-card border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Дансны дугаар</p>
                    <p className="font-medium text-sm font-mono">{bankDetails.accountNumber}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(bankDetails.accountNumber, "account")}>
                    {copiedField === "account" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="p-2 bg-card border rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Дансны нэр</p>
                  <p className="font-medium text-sm">{bankDetails.accountName}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(bankDetails.accountName, "name")}>
                  {copiedField === "name" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              {/* Transfer Code - Highlighted */}
              <div className="p-3 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-destructive">Гүйлгээний утга (заавал бичнэ!)</p>
                  <p className="font-bold text-2xl text-primary font-mono">{transferCode}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(transferCode, "code")}>
                  {copiedField === "code" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </>
          }

          {/* Free course notice */}
          {isFree &&
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-green-700 dark:text-green-400 font-medium">
                🎉 100% хөнгөлөлт! Төлбөр шаардлагагүй.
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Доорх товчийг дарснаар сургалт нээгдэнэ.
              </p>
            </div>
          }

          {/* Confirmation */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isFree &&
            <div className="flex items-center space-x-2">
                <Checkbox
                id="confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)} />
              
                <Label htmlFor="confirmed" className="text-sm cursor-pointer">
                  Төлбөр шилжүүлсэн
                </Label>
              </div>
            }

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isFree && !confirmed}>
              
              {isSubmitting ? "Илгээж байна..." : isFree ? "Үнэгүй авах" : "Баталгаажуулах"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>);

};

export default BankTransferDialog;