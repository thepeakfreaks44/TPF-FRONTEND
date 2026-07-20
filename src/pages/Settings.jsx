import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Building2, Save } from "lucide-react";

const EMPTY = {
  company_name: "THE PEAK FREAKS",
  tagline: "Adventure Operations · Trek · Gear · Transport",
  address: "", contact_phone: "", contact_email: "",
  gstin: "", website: "", logo_data_url: "", currency_symbol: "₹",
  invoice_terms: "",
};

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/settings").then((r) => setForm({ ...EMPTY, ...r.data }));
  }, []);

  const save = async () => {
    if (!isAdmin) return toast.error("Only admin can update settings");
    setBusy(true);
    try {
      await api.put("/settings", form);
      toast.success("Settings saved");
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const F = ({ label, field, type = "text" }) => (
    <div>
      <Label className="pf-label">{label}</Label>
      <Input type={type} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
             data-testid={`settings-input-${field}`} className="mt-1.5 bg-white" disabled={!isAdmin} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl" data-testid="settings-page">
      <div>
        <p className="pf-label mb-1">Configuration</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-sm text-[var(--pf-muted)] mt-1">These details appear on invoices, reports and PDF exports.</p>
      </div>

      <div className="pf-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-md bg-[var(--pf-sidebar)] text-white grid place-items-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold">{form.company_name}</div>
            <div className="text-xs text-neutral-500">{form.tagline}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Company Name" field="company_name" />
          <F label="Tagline" field="tagline" />
          <F label="Contact Phone" field="contact_phone" />
          <F label="Contact Email" field="contact_email" type="email" />
          <F label="GSTIN" field="gstin" />
          <F label="Website" field="website" />
          <F label="Currency Symbol" field="currency_symbol" />
          <F label="Logo URL (optional)" field="logo_data_url" />
        </div>

        <div>
          <Label className="pf-label">Registered Address</Label>
          <Textarea rows={2} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    data-testid="settings-input-address" className="mt-1.5 bg-white" disabled={!isAdmin} />
        </div>
        <div>
          <Label className="pf-label">Invoice Terms &amp; Conditions</Label>
          <Textarea rows={3} value={form.invoice_terms || ""} onChange={(e) => setForm({ ...form, invoice_terms: e.target.value })}
                    data-testid="settings-input-invoice_terms" className="mt-1.5 bg-white" disabled={!isAdmin}
                    placeholder="e.g. 50% advance required. Cancellation charges applicable." />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={!isAdmin || busy} data-testid="settings-save-button"
                  className="pf-btn-primary rounded-full gap-1.5">
            <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="text-xs text-neutral-500 border-l-2 border-[var(--pf-warning)] pl-3">
          Read-only view. Only admins can update company settings.
        </div>
      )}
    </div>
  );
}
