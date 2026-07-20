import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import { useAuth } from "@/context/AuthContext";

const currentMonth = new Date().toISOString().slice(0, 7);
const EMPTY = { staff_id: "", month: currentMonth, days_worked: 0, bonus: 0, deduction: 0, paid_amount: 0, payment_mode: "cash", notes: "" };
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Salaries() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
  const [r, s] = await Promise.all([
    api.get(filter ? `/salaries?month=${filter}` : "/salaries"),
    api.get("/staff"),
  ]);
  setRows(r.data);
  setStaff(s.data);
}, [filter]);

  useEffect(() => {
  load();
}, [load]);

  const save = async () => {
    try {
      const body = {
        ...form,
        days_worked: Number(form.days_worked) || 0,
        bonus: Number(form.bonus) || 0,
        deduction: Number(form.deduction) || 0,
        paid_amount: Number(form.paid_amount) || 0,
      };
      await api.post("/salaries", body);
      toast.success("Salary entry added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete salary entry?")) return;
    await api.delete(`/salaries/${id}`); toast.success("Deleted"); load();
  };

  const totalGross = rows.reduce((s, r) => s + Number(r.gross_amount || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  return (
    <div className="space-y-6" data-testid="salaries-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Payroll</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Staff Salaries</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Auto-calculates gross from rate × days worked (+ bonus − deduction).</p>
        </div>
        <div className="flex gap-2 items-center">
          <Label className="pf-label mr-2">Month</Label>
          <Input type="month" value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="salary-month-filter" className="w-40 bg-white" />
          <ExportButtons entity="salaries" testid="salaries" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="add-salary-button" className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> New Entry
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle className="font-display">New Salary Entry</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="pf-label">Staff Member</Label>
                  <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })}>
                    <SelectTrigger data-testid="salary-input-staff_id" className="mt-1.5 bg-white"><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} · {s.role} · {fmt(s.salary_rate)}/{s.salary_type === "per_day" ? "day" : "mo"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="pf-label">Month</Label>
                  <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} data-testid="salary-input-month" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Days Worked</Label>
                  <Input type="number" value={form.days_worked} onChange={(e) => setForm({ ...form, days_worked: e.target.value })} data-testid="salary-input-days_worked" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Bonus (₹)</Label>
                  <Input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} data-testid="salary-input-bonus" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Deduction (₹)</Label>
                  <Input type="number" value={form.deduction} onChange={(e) => setForm({ ...form, deduction: e.target.value })} data-testid="salary-input-deduction" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Paid Amount (₹)</Label>
                  <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} data-testid="salary-input-paid_amount" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger data-testid="salary-input-payment_mode" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="salary-save">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-card p-5"><p className="pf-label">Entries</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{rows.length}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Gross Payroll</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(totalGross)}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Paid</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-primary)]">{fmt(totalPaid)}</div></div>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Staff", "Month", "Type", "Rate", "Days", "Bonus", "Deduction", "Gross", "Paid", "Balance", "Mode", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="text-center py-12 text-neutral-400 text-sm">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No salary records yet.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`salary-row-${r.id}`}>
                <TableCell className="font-medium">{r.staff_name}</TableCell>
                <TableCell className="pf-tabular">{r.month}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.salary_type === "per_day" ? "Day" : "Month"}</span></TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.salary_rate)}</TableCell>
                <TableCell className="pf-tabular text-right">{r.days_worked}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.bonus)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.deduction)}</TableCell>
                <TableCell className="pf-tabular text-right font-medium">{fmt(r.gross_amount)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.paid_amount)}</TableCell>
                <TableCell className={`pf-tabular text-right ${r.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(r.balance)}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.payment_mode}</span></TableCell>
                <TableCell className="text-right">
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`salary-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
