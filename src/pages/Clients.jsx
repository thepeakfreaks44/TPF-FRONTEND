import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Receipt, Wallet, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import InvoiceDialog from "@/components/InvoiceDialog";
import PaymentsDialog from "@/components/PaymentsDialog";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  name: "", phone: "", email: "", company_name: "", trek_name: "",
  start_date: "", end_date: "", people_count: 1,
  trek_amount: 0, paid_amount: 0, payment_mode: "pending",
  booking_status: "confirmed", notes: "",
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Clients() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [rows, setRows] = useState([]);
  const [treks, setTreks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentsRow, setPaymentsRow] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => api.get("/clients").then((r) => setRows(r.data));
  useEffect(() => {
    load();
    api.get("/treks").then((r) => setTreks(r.data.filter((t) => t.is_active))).catch(() => {});
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (r) => {
    setEditing(r.id);
    // form.paid_amount should reflect the STORED initial paid (not the ledger total)
    setForm({ ...EMPTY, ...r, paid_amount: r.initial_paid ?? r.paid_amount ?? 0 });
    setOpen(true);
  };
  const save = async () => {
    try {
      const body = { ...form,
        people_count: Number(form.people_count) || 1,
        trek_amount: Number(form.trek_amount) || 0,
        paid_amount: Number(form.paid_amount) || 0,
      };
      // strip UI-only fields
      delete body.initial_paid; delete body.ledger_paid; delete body.balance;
      if (editing) {
        // Preserve original initial_paid amount when editing — send record.paid_amount which is total,
        // but we stored initial_paid separately; the form's paid_amount holds initial paid.
        await api.put(`/clients/${editing}`, body);
      } else {
        await api.post("/clients", body);
      }
      toast.success(editing ? "Client updated" : "Client added");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || e.message);
    }
  };

  const applyTrek = (trekId) => {
    const t = treks.find((x) => x.id === trekId);
    if (!t) return;
    const people = Number(form.people_count) || 1;
    setForm((f) => ({
      ...f,
      trek_name: t.name,
      trek_amount: Number(t.price_per_person) * people,
    }));
  };
  const del = async (id) => {
    if (!confirm("Delete this client entry?")) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    }
  };

  const totalTrek = rows.reduce((s, r) => s + Number(r.trek_amount || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && (r.booking_status || "confirmed") !== statusFilter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.name, r.phone, r.email, r.company_name, r.trek_name].some((x) => (x || "").toLowerCase().includes(s));
  });

  const STATUS_META = {
    confirmed: "bg-[var(--pf-success)]/10 text-[var(--pf-success)]",
    pending: "bg-[var(--pf-warning)]/10 text-[var(--pf-warning)]",
    completed: "bg-neutral-100 text-neutral-700",
    cancelled: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
  };

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Bookings</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Clients &amp; Treks</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">
            Track every trekker, their trek, and payments — automatic balance calculation.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/phone/company/trek…"
                 className="w-56 bg-white" data-testid="client-search" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="client-status-filter" className="w-40 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons entity="clients" testid="clients" />
          <Dialog open={open} onOpenChange={setOpen}>
            {canWrite && (
              <DialogTrigger asChild>
                <Button data-testid="add-client-button" onClick={openNew} className="pf-btn-primary rounded-full gap-1.5">
                  <Plus className="h-4 w-4" /> Add Client
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="font-display">{editing ? "Edit Client" : "New Client Entry"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {treks.length > 0 && !editing && (
                  <div className="md:col-span-2">
                    <Label className="pf-label">Pick Trek from Catalog (auto-fills amount)</Label>
                    <Select onValueChange={applyTrek}>
                      <SelectTrigger data-testid="client-input-trek_catalog" className="mt-1.5 bg-white">
                        <SelectValue placeholder="— Choose from catalog (optional) —" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {treks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} · {t.region || "—"} · ₹{Number(t.price_per_person).toLocaleString("en-IN")}/person
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {[
                  ["Full Name", "name", "text"],
                  ["Phone", "phone", "text"],
                  ["Email", "email", "email"],
                  ["Trek Name", "trek_name", "text"],
                  ["Start Date", "start_date", "date"],
                  ["End Date", "end_date", "date"],
                  ["People Count", "people_count", "number"],
                  ["Trek Amount (₹)", "trek_amount", "number"],
                  ["Initial Deposit (₹)", "paid_amount", "number"],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <Label className="pf-label">{label}</Label>
                    <Input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      data-testid={`client-input-${key}`}
                      className="mt-1.5 bg-white"
                    />
                  </div>
                ))}
                <div>
                  <Label className="pf-label">Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger data-testid="client-input-payment_mode" className="mt-1.5 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online (Bank)</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="pf-label">Booking Status</Label>
                  <Select value={form.booking_status || "confirmed"} onValueChange={(v) => setForm({ ...form, booking_status: v })}>
                    <SelectTrigger data-testid="client-input-booking_status" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="pf-label">Notes</Label>
                  <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                         data-testid="client-input-notes" className="mt-1.5 bg-white" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} data-testid="client-cancel">Cancel</Button>
                <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="client-save">
                  {editing ? "Update" : "Save Client"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-card p-5"><p className="pf-label">Total Clients</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{rows.length}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Booked Value</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(totalTrek)}</div></div>
        <div className="pf-card p-5"><p className="pf-label">Received</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-primary)]">{fmt(totalPaid)}</div></div>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Client", "Company", "Trek", "Dates", "Ppl", "Amount", "Paid", "Balance", "Status", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-12 text-neutral-400 text-sm">No matching bookings.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} data-testid={`client-row-${r.id}`}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-neutral-500">{r.phone}</div>
                </TableCell>
                <TableCell className="text-sm">{r.company_name || <span className="text-neutral-400">—</span>}</TableCell>
                <TableCell>{r.trek_name}</TableCell>
                <TableCell className="text-xs pf-tabular">{r.start_date} → {r.end_date}</TableCell>
                <TableCell className="pf-tabular">{r.people_count}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.trek_amount)}</TableCell>
                <TableCell className="pf-tabular text-right">{fmt(r.paid_amount)}</TableCell>
                <TableCell className={`pf-tabular text-right font-medium ${r.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(r.balance)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_META[r.booking_status || "confirmed"]}`}>
                    {r.booking_status || "confirmed"}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Link to={`/clients/${r.id}`} data-testid={`client-view-${r.id}`}>
                    <Button size="icon" variant="ghost" title="Client 360"><ExternalLink className="h-4 w-4 text-[var(--pf-info)]" /></Button>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => setPaymentsRow(r)} data-testid={`client-payments-${r.id}`} title="Payment ledger"><Wallet className="h-4 w-4 text-[var(--pf-info)]" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setInvoiceId(r.id)} data-testid={`client-invoice-${r.id}`} title="Send invoice"><Receipt className="h-4 w-4 text-[var(--pf-primary)]" /></Button>
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => openEdit(r)} data-testid={`client-edit-${r.id}`}><Pencil className="h-4 w-4" /></Button>}
                  {canWrite && <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`client-delete-${r.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDialog
        open={!!invoiceId}
        onOpenChange={(v) => !v && setInvoiceId(null)}
        entity="client"
        itemId={invoiceId}
      />

      <PaymentsDialog
        open={!!paymentsRow}
        onOpenChange={(v) => !v && setPaymentsRow(null)}
        entity="client"
        entityId={paymentsRow?.id}
        title={paymentsRow ? `${paymentsRow.name} · ${paymentsRow.trek_name}` : ""}
        totalAmount={paymentsRow?.trek_amount || 0}
        initialPaid={paymentsRow?.initial_paid || 0}
        onChange={load}
      />
    </div>
  );
}
