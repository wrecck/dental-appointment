"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";

export default function PatientPDFPage() {
  const params = useParams();
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPDF() {
      try {
        const response = await fetch(`/api/patients/${params.id}/pdf`);
        if (response.ok) {
          const htmlContent = await response.text();
          setHtml(htmlContent);
        }
      } catch (error) {
        console.error("Failed to fetch PDF:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPDF();
  }, [params.id]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-record.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border sticky top-0 z-10">
        <Link href={`/dashboard/patients/${params.id}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download HTML
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="bg-white rounded-lg border shadow-sm">
        <iframe
          srcDoc={html}
          className="w-full min-h-[800px] rounded-lg"
          title="Patient Record Preview"
        />
      </div>
    </div>
  );
}
