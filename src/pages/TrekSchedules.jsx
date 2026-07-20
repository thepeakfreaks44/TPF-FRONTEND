import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = {
  trek_name: "", trek_date: today(), end_date: today(), total_groups: 1, total_pax: 0,
  assigned_guide_id: "", assigned_vehicle_id: "", status: "scheduled", notes: "",
};
const STATUS_COLORS = {
  scheduled: "bg-[var(--pf-info)]/10 text-[var(--pf-info)]",
  active: "bg-[var(--pf-success)]/10 text-[var(--pf-success)]",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
};

export default function TrekSchedules() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [guides, setGuides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [s, st, v] = await Promise.all([
      api.get("/trek-schedules"),
      api.get("/staff"),
      api.get("/vehicles").catch(() => ({ data: [] })),
    ]);
    setRows(s.data);
    setGuides(st.data.filter((x) => (x.role || "").toLowerCase() === "guide"));
    setVehicles(v.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = {
        ...form,
        total_groups: Number(form.total_groups) || 1,
        total_pax: Number(form.total_pax) || 0,
        assigned_guide_id: form.assigned_guide_id || null,
        assigned_vehicle_id: form.assigned_vehicle_id || null,
      };
      if (editing) await api.put(`/trek-schedules/${editing}`, body);
      else await api.post("/trek-schedules", body);
      toast.success(editing ? "Schedule updated" : "Schedule added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete schedule?")) return;
    await api.delete(`/trek-schedules/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6" data-testid="trek-schedules-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Operations</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Trek Management</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Scheduled trek runs — assign guides &amp; vehicles, track pax and status.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canWrite && (
            <DialogTrigger asChild>
              <Button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}
                      data-testid="add-schedule-button" className="pf-btn-primary rounded-full gap-1.5">
                <Plus className="h-4 w-4" /> Schedule Trek
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Schedule" : "New Trek Schedule"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="pf-label">Trek Name</Label>
                <Input value={form.trek_name} onChange={(e) => setForm({ ...form, trek_name: e.target.value })}
                       data-testid="schedule-input-trek_name" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Trek Start Date</Label>
                <Input type="date" value={form.trek_date} onChange={(e) => setForm({ ...form, trek_date: e.target.value })}
                       data-testid="schedule-input-trek_date" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">End Date</Label>
                <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                       data-testid="schedule-input-end_date" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Total Groups</Label>
                <Input type="number" value={form.total_groups} onChange={(e) => setForm({ ...form, total_groups: e.target.value })}
                       data-testid="schedule-input-total_groups" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Total Pax</Label>
                <Input type="number" value={form.total_pax} onChange={(e) => setForm({ ...form, total_pax: e.target.value })}
                       data-testid="schedule-input-total_pax" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Assign Guide</Label>
                <Select value={form.assigned_guide_id || "none"} onValueChange={(v) => setForm({ ...form, assigned_guide_id: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="schedule-input-assigned_guide_id" className="mt-1.5 bg-white"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">— None —</SelectItem>
                    {guides.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="pf-label">Assign Vehicle</Label>
                <Select value={form.assigned_vehicle_id || "none"} onValueChange={(v) => setForm({ ...form, assigned_vehicle_id: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="schedule-input-assigned_vehicle_id" className="mt-1.5 bg-white"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">— None —</SelectItem>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.vehicle_no} · {v.vehicle_type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="pf-label">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="schedule-input-status" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="pf-label">Notes</Label>
                <Textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          data-testid="schedule-input-notes" className="mt-1.5 bg-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="schedule-save">{editing ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Trek", "Date", "Groups", "Pax", "Guide", "Vehicle", "Status", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-neutral-400 text-sm">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No trek schedules yet.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`schedule-row-${r.id}`}>
                <TableCell className="font-medium">{r.trek_name}</TableCell>
                <TableCell className="text-xs pf-tabular">{r.trek_date} {r.end_date ? `→ ${r.end_date}` : ""}</TableCell>
                <TableCell className="pf-tabular">{r.total_groups}</TableCell>
                <TableCell className="pf-tabular">{r.total_pax}</TableCell>
                <TableCell>{r.guide_name || <span className="text-neutral-400">—</span>}</TableCell>
                <TableCell>{r.vehicle_no || <span className="text-neutral-400">—</span>}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[r.status]}`}>{r.status}</span></TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`schedule-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`schedule-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
