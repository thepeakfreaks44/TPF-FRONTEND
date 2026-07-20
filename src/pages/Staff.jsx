import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, HardHat } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  name: "", phone: "", role: "Guide", salary_type: "per_month",
  salary_rate: 0, active_trek: "", is_active: true, joined_on: "", notes: "",
};
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Staff() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/staff").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form, salary_rate: Number(form.salary_rate) || 0 };
      if (editing) await api.put(`/staff/${editing}`, body);
      else await api.post("/staff", body);
      toast.success(editing ? "Staff updated" : "Staff added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete staff?")) return;
    await api.delete(`/staff/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6" data-testid="staff-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Team</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Guides, porters, cooks, drivers — with per-month or per-day salaries.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons entity="staff" testid="staff" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}
                        data-testid="add-staff-button" className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Staff" : "New Staff Member"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Name", "name", "text"],
                  ["Phone", "phone", "text"],
                  ["Role (Guide/Porter/etc)", "role", "text"],
                  ["Salary Rate (₹)", "salary_rate", "number"],
                  ["Active Trek", "active_trek", "text"],
                  ["Joined On", "joined_on", "date"],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <Label className="pf-label">{label}</Label>
                    <Input type={type} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                           data-testid={`staff-input-${key}`} className="mt-1.5 bg-white" />
                  </div>
                ))}
                <div>
                  <Label className="pf-label">Salary Type</Label>
                  <Select value={form.salary_type} onValueChange={(v) => setForm({ ...form, salary_type: v })}>
                    <SelectTrigger data-testid="staff-input-salary_type" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="per_month">Per Month</SelectItem>
                      <SelectItem value="per_day">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between border rounded-md px-3 py-2 mt-6">
                  <div>
                    <Label className="pf-label">Currently Active</Label>
                    <p className="text-xs text-neutral-500">Toggle on if this person is on a trek</p>
                  </div>
                  <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} data-testid="staff-input-is_active" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="staff-save">{editing ? "Update" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Role", "Salary", "Rate", "Active Trek", "Status", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                <HardHat className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No staff yet.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`staff-row-${r.id}`}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-neutral-500">{r.phone}</div>
                </TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.salary_type === "per_day" ? "Per Day" : "Per Month"}</span></TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.salary_rate)}</TableCell>
                <TableCell>{r.active_trek || <span className="text-neutral-400">—</span>}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-[var(--pf-success)]/10 text-[var(--pf-success)]" : "bg-neutral-100 text-neutral-500"}`}>
                    {r.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`staff-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`staff-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
