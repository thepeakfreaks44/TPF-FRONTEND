import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import InvoiceDialog from "@/components/InvoiceDialog";
import PaymentsDialog from "@/components/PaymentsDialog";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  customer_name: "", customer_phone: "", gear_id: "",
  qty: 1, rent_date: "", return_date: "", daily_rate: 0,
  paid_amount: 0, payment_mode: "pending", returned: false,
};
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Rentals() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [gear, setGear] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentsRow, setPaymentsRow] = useState(null);

  const load = async () => {
    const [r, g] = await Promise.all([api.get("/rentals"), api.get("/gear")]);
    setRows(r.data); setGear(g.data);
  };
  useEffect(() => { load(); }, []);

  const onGearPick = (id) => {
    const g = gear.find((x) => x.id === id);
    setForm({ ...form, gear_id: id, daily_rate: g?.rent_per_day || 0 });
  };

  const save = async () => {
    try {
      const body = {
        ...form,
        qty: Number(form.qty) || 1,
        daily_rate: Number(form.daily_rate) || 0,
        paid_amount: Number(form.paid_amount) || 0,
      };
      if (editing) await api.put(`/rentals/${editing}`, body);
      else await api.post("/rentals", body);
      toast.success(editing ? "Rental updated" : "Rental added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete rental?")) return;
    await api.delete(`/rentals/${id}`); toast.success("Deleted"); load();
  };

  const totalRev = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  return (
    <div className="space-y-6" data-testid="rentals-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Rentals</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Gear Rentals</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Days × rate × quantity is calculated automatically.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons entity="rentals" testid="rentals" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}
                        data-testid="add-rental-button" className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> New Rental
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Rental" : "New Rental"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="pf-label">Customer Name</Label>
                  <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                         data-testid="rental-input-customer_name" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Customer Phone</Label>
                  <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                         data-testid="rental-input-customer_phone" className="mt-1.5 bg-white" />
                </div>
                <div className="md:col-span-2">
                  <Label className="pf-label">Gear Item</Label>
                  <Select value={form.gear_id} onValueChange={onGearPick}>
                    <SelectTrigger data-testid="rental-input-gear_id" className="mt-1.5 bg-white"><SelectValue placeholder="Select gear" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {gear.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name} · {fmt(g.rent_per_day)}/day</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="pf-label">Qty</Label>
                  <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                         data-testid="rental-input-qty" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Daily Rate (₹)</Label>
                  <Input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
                         data-testid="rental-input-daily_rate" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Rent Date</Label>
                  <Input type="date" value={form.rent_date} onChange={(e) => setForm({ ...form, rent_date: e.target.value })}
                         data-testid="rental-input-rent_date" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Return Date</Label>
                  <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                         data-testid="rental-input-return_date" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Initial Deposit (₹)</Label>
                  <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                         data-testid="rental-input-paid_amount" className="mt-1.5 bg-white" />
                </div>
                <div>
                  <Label className="pf-label">Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger data-testid="rental-input-payment_mode" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
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
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="rental-save">{editing ? "Update" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-card p-5"><p className="pf-label">Rentals</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{rows.length}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Total Value</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(totalRev)}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Collected</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-primary)]">{fmt(totalPaid)}</div></div>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Customer", "Gear", "Qty", "Dates", "Days", "Rate", "Total", "Paid", "Balance", "Mode", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-12 text-neutral-400 text-sm">No rentals yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`rental-row-${r.id}`}>
                <TableCell><div className="font-medium">{r.customer_name}</div><div className="text-xs text-neutral-500">{r.customer_phone}</div></TableCell>
                <TableCell>{r.gear_name}</TableCell>
                <TableCell className="pf-tabular">{r.qty}</TableCell>
                <TableCell className="text-xs pf-tabular">{r.rent_date} → {r.return_date}</TableCell>
                <TableCell className="pf-tabular">{r.days}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.daily_rate)}</TableCell>
                <TableCell className="pf-tabular text-right font-medium">{fmt(r.total_amount)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.paid_amount)}</TableCell>
                <TableCell className={`pf-tabular text-right ${r.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(r.balance)}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.payment_mode}</span></TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setPaymentsRow(r)} data-testid={`rental-payments-${r.id}`} title="Payment ledger"><Wallet className="h-4 w-4 text-[var(--pf-info)]" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setInvoiceId(r.id)} data-testid={`rental-invoice-${r.id}`} title="Send invoice"><Receipt className="h-4 w-4 text-[var(--pf-primary)]" /></Button>
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r }); setOpen(true); }} data-testid={`rental-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`rental-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDialog
        open={!!invoiceId}
        onOpenChange={(v) => !v && setInvoiceId(null)}
        entity="rental"
        itemId={invoiceId}
      />

      <PaymentsDialog
        open={!!paymentsRow}
        onOpenChange={(v) => !v && setPaymentsRow(null)}
        entity="rental"
        entityId={paymentsRow?.id}
        title={paymentsRow ? `${paymentsRow.customer_name} · ${paymentsRow.gear_name}` : ""}
        totalAmount={paymentsRow?.total_amount || 0}
        initialPaid={paymentsRow?.initial_paid || 0}
        onChange={load}
      />
    </div>
  );
}
