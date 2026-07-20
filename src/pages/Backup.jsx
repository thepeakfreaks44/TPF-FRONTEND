import { useEffect, useState } from "react";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Download, Upload, Database } from "lucide-react";

export default function Backup() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [wipe, setWipe] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const exportBackup = async () => {
    const t = localStorage.getItem("pf_token") || "";
    const res = await fetch(`${API}/backup/export`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return toast.error("Export failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `peakfreaks_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    toast.success("Backup downloaded");
  };

  const restore = async () => {
    if (!file) return toast.error("Select a backup JSON first");
    if (!confirm(wipe ? "This will WIPE existing data and restore from backup. Continue?" : "Restore backup? Existing IDs will be upserted."))
      return;
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await api.post("/backup/restore", { payload, wipe_first: wipe });
      setLastResult(res.data.restored);
      toast.success("Restore complete");
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Restore failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="backup-page">
      <div>
        <p className="pf-label mb-1">Data Safety</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Backup &amp; Restore</h1>
        <p className="text-sm text-[var(--pf-muted)] mt-1">Download a full JSON snapshot or restore from an earlier backup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="pf-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-[var(--pf-info)]/10 text-[var(--pf-info)] grid place-items-center">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="pf-label">Export</p>
              <h3 className="font-display text-lg font-bold">Download full backup</h3>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            Downloads a JSON containing all clients, bookings, rentals, gear, transport, staff, salaries, treks, expenses, attendance, transporters, vehicles, trek schedules and settings.
          </p>
          <Button onClick={exportBackup} disabled={!isAdmin} data-testid="backup-export-button"
                  className="pf-btn-primary rounded-full gap-1.5">
            <Download className="h-4 w-4" /> Download Backup
          </Button>
        </div>

        <div className="pf-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-[var(--pf-warning)]/10 text-[var(--pf-warning)] grid place-items-center">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="pf-label">Import</p>
              <h3 className="font-display text-lg font-bold">Restore from backup</h3>
            </div>
          </div>
          <div className="space-y-3">
            <Input type="file" accept="application/json,.json" onChange={(e) => setFile(e.target.files?.[0] || null)}
                   data-testid="backup-file-input" disabled={!isAdmin} className="bg-white" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} data-testid="backup-wipe-checkbox" />
              <span>Wipe existing data before restore (destructive)</span>
            </label>
            <Button onClick={restore} disabled={!isAdmin || !file || busy} data-testid="backup-restore-button"
                    className="rounded-full gap-1.5 bg-[var(--pf-warning)] hover:opacity-90 text-white">
              <Upload className="h-4 w-4" /> {busy ? "Restoring…" : "Restore Backup"}
            </Button>
          </div>
          {lastResult && (
            <div className="mt-4 border-t pt-3 text-xs">
              <p className="pf-label mb-2">Restored counts</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(lastResult).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-neutral-500">{k}</span>
                    <span className="pf-tabular font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="text-xs text-neutral-500 border-l-2 border-[var(--pf-warning)] pl-3">
          Admin only. Only admins can export or restore backups.
        </div>
      )}
    </div>
  );
}
