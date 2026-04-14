import { useState } from "react";
import { Download, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import certificateTemplate from "@/assets/certificate-template.jpg";

interface CertificateGeneratorProps {
  recipientName: string;
  courseName: string;
  issuedAt: string;
  score: number;
  totalQuestions: number;
}

const CertificateGenerator = ({
  recipientName,
  courseName,
  issuedAt,
  score,
  totalQuestions,
}: CertificateGeneratorProps) => {
  const [generating, setGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      // Create PDF in landscape A4
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Load certificate template image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = certificateTemplate;
      });

      // Add background image
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);

      // Add recipient name - centered on the long underline
      // Position: left 67.6%, top 43% of page
      const nameX = pageWidth * 0.676;
      const nameY = pageHeight * 0.43;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      pdf.setTextColor(17, 17, 17); // #111
      pdf.text(recipientName, nameX, nameY, {
        align: "center",
      });

      // Add date - centered above the DATE underline
      // Position: left 59.9%, top 84.0% of page
      const dateX = pageWidth * 0.599;
      const dateY = pageHeight * 0.84;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(85, 85, 85); // #555
      pdf.text(formatDate(issuedAt), dateX, dateY, {
        align: "center",
      });

      // Download PDF
      pdf.save(`certificate-${recipientName.replace(/\s+/g, "_")}.pdf`);
      toast.success("Сертификат татагдлаа!");
    } catch (error) {
      console.error("Certificate generation error:", error);
      toast.error("Сертификат үүсгэхэд алдаа гарлаа");
    } finally {
      setGenerating(false);
    }
  };

  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="p-6 text-center">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
        <Award className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold mb-2">Баяр хүргэе!</h3>
      <p className="text-muted-foreground mb-2">
        Та сертификатийн шалгалтыг амжилттай өглөө
      </p>
      <div className="text-4xl font-bold text-green-600 mb-4">{percentage}%</div>

      {/* Preview card */}
      <div className="relative max-w-lg mx-auto mb-6 rounded-lg overflow-hidden shadow-lg border">
        <img
          src={certificateTemplate}
          alt="Certificate Preview"
          className="w-full"
        />
        {/* Recipient name - positioned at 67.6% left, 43% top */}
        <p 
          className="absolute text-center font-extrabold"
          style={{
            left: "67.6%",
            top: "43%",
            width: "60%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(16px, 4vw, 28px)",
            color: "#111",
          }}
        >
          {recipientName}
        </p>
        {/* Date - positioned at 59.9% left, 84% top */}
        <p 
          className="absolute text-center font-semibold"
          style={{
            left: "59.9%",
            top: "84%",
            width: "22%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(8px, 1.8vw, 12px)",
            color: "#555",
          }}
        >
          {formatDate(issuedAt)}
        </p>
      </div>

      <Button onClick={generatePDF} size="lg" className="gap-2" disabled={generating}>
        <Download className="h-5 w-5" />
        {generating ? "Үүсгэж байна..." : "Сертификат татах (PDF)"}
      </Button>
    </div>
  );
};

export default CertificateGenerator;
