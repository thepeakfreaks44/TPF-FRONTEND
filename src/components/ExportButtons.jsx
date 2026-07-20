import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { API } from "@/lib/api";

export default function ExportButtons({ entity, testid }) {
  const download = (fmt) => {
    const t = localStorage.getItem("pf_token") || "";
    const url = `${API}/export/${entity}.${fmt}`;
    // Use fetch to include auth
    fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `peakfreaks_${entity}.${fmt}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => download("xlsx")}
        data-testid={`${testid}-export-xlsx`}
        className="gap-1.5"
      >
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => download("pdf")}
        data-testid={`${testid}-export-pdf`}
        className="gap-1.5"
      >
        <FileDown className="h-4 w-4" /> PDF
      </Button>
    </div>
  );
}
