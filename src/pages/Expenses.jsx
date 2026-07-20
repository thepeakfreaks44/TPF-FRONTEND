import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { date: new Date().toISOString().slice(0, 10), category: "General", amount: 0, description: "", payment_mode: "cash" };
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const CATS = ["General", "Fuel", "Food", "Permits", "Equipment", "Repairs", "Rent", "Utilities", "Marketing", "Office", "Miscellaneous"];

export default function Expenses() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const load = () => api.get("/expenses").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form, amount: Number(form.amount) || 0 };
      if (editing) await api.put(`/expenses/${editing}`, body);
      else await api.post("/expenses", body);
      toast.success(editing ? "Expense updated" : "Expense added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete expense?")) return;
    await api.delete(`/expenses/${id}`); toast.success("Deleted"); load();
  };

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.category, r.description, r.payment_mode].some((x) => (x || "").toLowerCase().includes(s));
  });
  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Money Out</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Fuel, permits, food, repairs — everything the business spends.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
                 className="w-56 bg-white" data-testid="expense-search" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}
                        data-testid="add-expense-button" className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Expense" : "New Expense"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="pf-label">Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="expense-input-date" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger data-testid="expense-input-category" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="pf-label">Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="expense-input-amount" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger data-testid="expense-input-payment_mode" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="pf-label">Description</Label>
                  <Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="expense-input-description" className="mt-1.5 bg-white" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="expense-save">{editing ? "Update" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-card p-5"><p className="pf-label">Entries</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{filtered.length}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Total</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-danger)]">{fmt(total)}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Cash out</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(filtered.filter((r) => r.payment_mode === "cash").reduce((s, r) => s + Number(r.amount || 0), 0))}</div></div>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Date", "Category", "Amount", "Mode", "Description", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-neutral-400 text-sm">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No expenses recorded.
              </TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} data-testid={`expense-row-${r.id}`}>
                <TableCell className="pf-tabular">{r.date}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.category}</span></TableCell>
                <TableCell className="pf-tabular text-right font-medium text-[var(--pf-danger)]">{fmt(r.amount)}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.payment_mode}</span></TableCell>
                <TableCell className="text-sm text-neutral-600 max-w-xs truncate">{r.description}</TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`expense-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`expense-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
