import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Mountain } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { name: "", region: "", duration_days: 1, difficulty: "Moderate", price_per_person: 0, description: "", is_active: true };
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const DIFF_COLOR = {
  Easy: "bg-[var(--pf-success)]/10 text-[var(--pf-success)]",
  Moderate: "bg-[var(--pf-info)]/10 text-[var(--pf-info)]",
  Difficult: "bg-[var(--pf-warning)]/10 text-[var(--pf-warning)]",
  Extreme: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
};

export default function Treks() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/treks").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form, duration_days: Number(form.duration_days) || 1, price_per_person: Number(form.price_per_person) || 0 };
      if (editing) await api.put(`/treks/${editing}`, body);
      else await api.post("/treks", body);
      toast.success(editing ? "Trek updated" : "Trek added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete this trek?")) return;
    await api.delete(`/treks/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6" data-testid="treks-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Catalog</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Trek Catalog</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">
            Saved treks with default pricing — pick one when adding a client to auto-fill amount.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canWrite && (
            <DialogTrigger asChild>
              <Button data-testid="add-trek-button" onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }} className="pf-btn-primary rounded-full gap-1.5">
                <Plus className="h-4 w-4" /> Add Trek
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Trek" : "New Trek"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="pf-label">Trek Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                       data-testid="trek-input-name" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Region</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                       data-testid="trek-input-region" className="mt-1.5 bg-white" placeholder="e.g. Uttarakhand" />
              </div>
              <div>
                <Label className="pf-label">Duration (days)</Label>
                <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                       data-testid="trek-input-duration_days" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger data-testid="trek-input-difficulty" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Difficult">Difficult</SelectItem>
                    <SelectItem value="Extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="pf-label">Price / person (₹)</Label>
                <Input type="number" value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: e.target.value })}
                       data-testid="trek-input-price_per_person" className="mt-1.5 bg-white" />
              </div>
              <div className="col-span-2">
                <Label className="pf-label">Description</Label>
                <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                          data-testid="trek-input-description" rows={3} className="mt-1.5 bg-white" />
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2 col-span-2">
                <div>
                  <Label className="pf-label">Active</Label>
                  <p className="text-xs text-neutral-500">Available for new bookings</p>
                </div>
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} data-testid="trek-input-is_active" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="trek-save">{editing ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Region", "Duration", "Difficulty", "Price / Person", "Status", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                <Mountain className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No treks in catalog. Add one to speed up bookings.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`trek-row-${r.id}`}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  {r.description && <div className="text-xs text-neutral-500 max-w-xs truncate">{r.description}</div>}
                </TableCell>
                <TableCell>{r.region || "—"}</TableCell>
                <TableCell className="pf-tabular">{r.duration_days} days</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${DIFF_COLOR[r.difficulty]}`}>{r.difficulty}</span></TableCell>
                <TableCell className="pf-tabular text-right font-medium">{fmt(r.price_per_person)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-[var(--pf-success)]/10 text-[var(--pf-success)]" : "bg-neutral-100 text-neutral-500"}`}>
                    {r.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`trek-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`trek-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
