import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Backpack } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { name: "", category: "General", total_qty: 1, available_qty: 1, rent_per_day: 0, deposit: 0, notes: "" };
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Gear() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/gear").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = {
        ...form,
        total_qty: Number(form.total_qty) || 0,
        available_qty: Number(form.available_qty) || 0,
        rent_per_day: Number(form.rent_per_day) || 0,
        deposit: Number(form.deposit) || 0,
      };
      if (editing) await api.put(`/gear/${editing}`, body);
      else await api.post("/gear", body);
      toast.success(editing ? "Gear updated" : "Gear added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete this gear item?")) return;
    await api.delete(`/gear/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6" data-testid="gear-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Inventory</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Rental Gear</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Add trekking equipment you rent out — tents, ropes, jackets, boots and more.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canWrite && (
            <DialogTrigger asChild>
              <Button data-testid="add-gear-button" onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }} className="pf-btn-primary rounded-full gap-1.5">
                <Plus className="h-4 w-4" /> Add Gear
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Gear" : "New Gear Item"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Item Name", "name", "text", 2],
                ["Category", "category", "text", 1],
                ["Total Qty", "total_qty", "number", 1],
                ["Available Qty", "available_qty", "number", 1],
                ["Rent per Day (₹)", "rent_per_day", "number", 1],
                ["Deposit (₹)", "deposit", "number", 1],
                ["Notes", "notes", "text", 2],
              ].map(([label, key, type, col]) => (
                <div key={key} className={col === 2 ? "col-span-2" : ""}>
                  <Label className="pf-label">{label}</Label>
                  <Input type={type} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                         data-testid={`gear-input-${key}`} className="mt-1.5 bg-white" />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="gear-save">{editing ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Item", "Category", "Total", "Available", "Rent/Day", "Deposit", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                <Backpack className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                Add your first gear item to start renting.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`gear-row-${r.id}`}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{r.category}</span></TableCell>
                <TableCell className="pf-tabular">{r.total_qty}</TableCell>
                <TableCell className="pf-tabular">{r.available_qty}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.rent_per_day)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.deposit)}</TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`gear-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`gear-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
