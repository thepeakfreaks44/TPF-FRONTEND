import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, MessageCircle, MessageSquare, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import api, { API, formatApiError } from "@/lib/api";

/**
 * Invoice / share dialog. props:
 *  - open, onOpenChange
 *  - entity: 'client' | 'rental' | 'transport'
 *  - itemId: uuid
 *  - triggerLabel: (optional)
 */
export default function InvoiceDialog({ open, onOpenChange, entity, itemId }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [filename, setFilename] = useState("invoice");

  useEffect(() => {
    if (!open || !itemId) return;
    setLoading(true);
    api.get(`/invoice/${entity}/${itemId}`)
      .then((r) => {
        setText(r.data.text || "");
        setPhone(r.data.phone || "");
        setSubject(r.data.subject || "Invoice");
        setFilename(r.data.filename || "invoice");
      })
      .catch((e) => {
        toast.error(formatApiError(e?.response?.data?.detail) || e.message);
      })
      .finally(() => setLoading(false));
  }, [open, entity, itemId]);

  const clean = (p) => (p || "").replace(/\D+/g, "");

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invoice copied to clipboard");
    } catch {
      toast.error("Copy failed – select and copy manually.");
    }
  };

  const shareWhatsApp = () => {
    const num = clean(phone);
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareSMS = () => {
    const num = clean(phone);
    const url = `sms:${num}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const shareEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const downloadPdf = async () => {
    const t = localStorage.getItem("pf_token") || "";
    const res = await fetch(`${API}/invoice/${entity}/${itemId}/pdf`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white" data-testid="invoice-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">{subject || "Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="pf-label">Recipient phone (for WhatsApp / SMS)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              data-testid="invoice-phone-input"
              className="mt-1.5 bg-white"
            />
          </div>
          <div>
            <Label className="pf-label">Invoice message (editable)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              data-testid="invoice-text-input"
              className="mt-1.5 font-mono text-xs bg-white"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyText} data-testid="invoice-copy-button" className="gap-1.5">
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPdf} data-testid="invoice-pdf-button" className="gap-1.5">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={shareEmail} data-testid="invoice-email-button" className="gap-1.5">
              <Mail className="h-4 w-4" /> Email
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={shareSMS} data-testid="invoice-sms-button" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> SMS
            </Button>
            <Button size="sm" onClick={shareWhatsApp} data-testid="invoice-whatsapp-button"
                    className="gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
