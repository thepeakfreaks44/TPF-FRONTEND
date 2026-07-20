import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Truck, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import InvoiceDialog from "@/components/InvoiceDialog";
import PaymentsDialog from "@/components/PaymentsDialog";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  vehicle_no: "", vehicle_type: "SUV", driver_name: "", driver_phone: "",
  transporter_name: "", transporter_phone: "",
  booking_id: "", client_name: "", trek_name: "",
  pickup: "", drop: "", route: "", pax: 0,
  rounds: 0, rate_per_round: 0,
  start_date: "", end_date: "", price_per_day: 0, paid_amount: 0,
  payment_mode: "pending", trek_ref: "", status: "scheduled", notes: "",
};
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const STATUS_COLORS = {
  scheduled: "bg-[var(--pf-info)]/10 text-[var(--pf-info)]",
  active: "bg-[var(--pf-success)]/10 text-[var(--pf-success)]",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
};

export default function Transport() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentsRow, setPaymentsRow] = useState(null);
  const [reports, setReports] = useState(null);
  const [reportsOpen, setReportsOpen] = useState(false);

  const loadReports = () => api.get("/transport/reports").then((r) => setReports(r.data));
  useEffect(() => { loadReports(); }, []);

  const load = () => api.get("/transport").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form,
        price_per_day: Number(form.price_per_day) || 0,
        paid_amount: Number(form.paid_amount) || 0,
        rounds: Number(form.rounds) || 0,
        rate_per_round: Number(form.rate_per_round) || 0,
        pax: Number(form.pax) || 0,
      };
      if (editing) await api.put(`/transport/${editing}`, body);
      else await api.post("/transport", body);
      toast.success(editing ? "Transport updated" : "Transport added");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete transport entry?")) return;
    await api.delete(`/transport/${id}`); toast.success("Deleted"); load();
  };

  const total = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const paid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  return (
    <div className="space-y-6" data-testid="transport-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Fleet</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Transport</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Vehicles, routes and driver payments — auto-calculated per day.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons entity="transport" testid="transport" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}
                        data-testid="add-transport-button" className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> Add Vehicle Trip
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Trip" : "New Vehicle Trip"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Vehicle Number", "vehicle_no", "text"],
                  ["Vehicle Type", "vehicle_type", "text"],
                  ["Driver Name", "driver_name", "text"],
                  ["Driver Phone", "driver_phone", "text"],
                  ["Transporter Name", "transporter_name", "text"],
                  ["Transporter Phone", "transporter_phone", "text"],
                  ["Client Name (optional)", "client_name", "text"],
                  ["Trek Name", "trek_name", "text"],
                  ["Pickup Point", "pickup", "text"],
                  ["Drop Point", "drop", "text"],
                  ["Route", "route", "text"],
                  ["Pax", "pax", "number"],
                  ["Rounds", "rounds", "number"],
                  ["Rate per Round (₹)", "rate_per_round", "number"],
                  ["Start Date", "start_date", "date"],
                  ["End Date", "end_date", "date"],
                  ["Price per Day (₹) — fallback", "price_per_day", "number"],
                  ["Initial Deposit (₹)", "paid_amount", "number"],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <Label className="pf-label">{label}</Label>
                    <Input type={type} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                           data-testid={`transport-input-${key}`} className="mt-1.5 bg-white" />
                  </div>
                ))}
                <div>
                  <Label className="pf-label">Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger data-testid="transport-input-payment_mode" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="pf-label">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger data-testid="transport-input-status" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="transport-save">{editing ? "Update" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-card p-5"><p className="pf-label">Trips</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{rows.length}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Total Value</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(total)}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Collected</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-primary)]">{fmt(paid)}</div></div>
      </div>

      {/* Reports toggle */}
      <div className="pf-card p-5" data-testid="transport-reports-panel">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setReportsOpen((v) => !v)}>
          <div>
            <p className="pf-label">Transport Breakdown</p>
            <h3 className="font-display text-lg font-bold">Vehicle · Route · Driver · Transporter</h3>
          </div>
          <Button size="sm" variant="outline" data-testid="transport-reports-toggle">
            {reportsOpen ? "Hide" : "Show"}
          </Button>
        </div>
        {reportsOpen && reports && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              ["By Vehicle", reports.by_vehicle, "vehicle"],
              ["By Route", reports.by_route, "route"],
              ["By Driver", reports.by_driver, "driver"],
              ["By Transporter", reports.by_transporter, "transporter"],
            ].map(([title, list, tid]) => (
              <div key={tid} className="border rounded-md p-3" data-testid={`transport-report-${tid}`}>
                <p className="pf-label mb-2">{title}</p>
                {list.length === 0 ? <p className="text-xs text-neutral-400">No data.</p> : (
                  <div className="max-h-56 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="text-neutral-500 pf-label">
                        <tr><th className="text-left">{title.replace("By ", "")}</th><th className="text-right">Trips</th><th className="text-right">Rounds</th><th className="text-right">Total</th><th className="text-right">Pending</th></tr>
                      </thead>
                      <tbody>
                        {list.slice(0, 8).map((b) => (
                          <tr key={b.key} className="border-t border-dashed border-neutral-200">
                            <td className="py-1 truncate max-w-[120px]">{b.key}</td>
                            <td className="text-right pf-tabular">{b.trips}</td>
                            <td className="text-right pf-tabular">{b.rounds}</td>
                            <td className="text-right pf-tabular font-medium">{fmt(b.total)}</td>
                            <td className={`text-right pf-tabular ${b.pending > 0 ? "text-[var(--pf-danger)]" : "text-neutral-400"}`}>{fmt(b.pending)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Vehicle", "Route", "Dates", "Days", "Rate/Day", "Total", "Paid", "Balance", "Status", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-12 text-neutral-400 text-sm">
                <Truck className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                No vehicle trips yet.
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} data-testid={`transport-row-${r.id}`}>
                <TableCell>
                  <div className="font-medium">{r.vehicle_no}</div>
                  <div className="text-xs text-neutral-500">{r.vehicle_type} · {r.driver_name}</div>
                </TableCell>
                <TableCell>{r.route}</TableCell>
                <TableCell className="text-xs pf-tabular">{r.start_date} → {r.end_date}</TableCell>
                <TableCell className="pf-tabular">{r.days}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.price_per_day)}</TableCell>
                <TableCell className="pf-tabular text-right font-medium">{fmt(r.total_amount)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.paid_amount)}</TableCell>
                <TableCell className={`pf-tabular text-right ${r.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(r.balance)}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[r.status]}`}>{r.status}</span></TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setPaymentsRow(r)} data-testid={`transport-payments-${r.id}`} title="Payment ledger"><Wallet className="h-4 w-4 text-[var(--pf-info)]" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setInvoiceId(r.id)} data-testid={`transport-invoice-${r.id}`} title="Send invoice"><Receipt className="h-4 w-4 text-[var(--pf-primary)]" /></Button>
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setForm({ ...EMPTY, ...r, paid_amount: r.initial_paid ?? r.paid_amount ?? 0 }); setOpen(true); }} data-testid={`transport-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`transport-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDialog
        open={!!invoiceId}
        onOpenChange={(v) => !v && setInvoiceId(null)}
        entity="transport"
        itemId={invoiceId}
      />

      <PaymentsDialog
        open={!!paymentsRow}
        onOpenChange={(v) => !v && setPaymentsRow(null)}
        entity="transport"
        entityId={paymentsRow?.id}
        title={paymentsRow ? `${paymentsRow.vehicle_no} · ${paymentsRow.route}` : ""}
        totalAmount={paymentsRow?.total_amount || 0}
        initialPaid={paymentsRow?.initial_paid || 0}
        onChange={load}
      />
    </div>
  );
}
