import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const ENTITY_LABEL = { client: "Client", rental: "Rental", transport: "Transport" };

/**
 * Payments (ledger) dialog. Props:
 *  - open, onOpenChange
 *  - entity: 'client' | 'rental' | 'transport'
 *  - entityId, title (subtitle text)
 *  - totalAmount, initialPaid (from parent record)
 *  - onChange: called after any add/delete so parent can refresh list
 */
export default function PaymentsDialog({
  open,
  onOpenChange,
  entity,
  entityId,
  title,
  totalAmount = 0,
  initialPaid = 0,
  onChange,
}) {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";

  const [rows, setRows] = useState([]);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!entityId) return;

    api
      .get(`/payments?entity=${entity}&entity_id=${entityId}`)
      .then((r) => setRows(r.data))
      .catch((err) => {
        console.error(err);
      });
  }, [entity, entityId]);

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, load]);

  const ledgerTotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalPaid = Number(initialPaid || 0) + ledgerTotal;
  const balance = Math.max(0, Number(totalAmount || 0) - totalPaid);

  const addPayment = async () => {
    const val = Number(amount);

    if (!val || val <= 0) {
      return toast.error("Enter a positive amount");
    }

    setBusy(true);

    try {
      await api.post("/payments", {
        entity,
        entity_id: entityId,
        amount: val,
        mode,
        date,
        notes,
      });

      toast.success("Payment recorded");

      setAmount("");
      setNotes("");

      load();
      onChange?.();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const removePayment = async (id) => {
    if (!confirm("Remove this payment entry?")) return;

    await api.delete(`/payments/${id}`);

    toast.success("Removed");

    load();
    onChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white" data-testid="payments-dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[var(--pf-primary)]" />
            Payment Ledger — {ENTITY_LABEL[entity]}
          </DialogTitle>

          {title && (
            <div className="text-xs text-neutral-500 mt-1">
              {title}
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3">
          <div className="pf-card p-3">
            <p className="pf-label">Total</p>
            <div className="font-display text-lg font-bold pf-tabular">
              {fmt(totalAmount)}
            </div>
          </div>

          <div className="pf-card p-3">
            <p className="pf-label">Initial</p>
            <div className="font-display text-lg font-bold pf-tabular">
              {fmt(initialPaid)}
            </div>
          </div>

          <div className="pf-card p-3">
            <p className="pf-label">Installments</p>
            <div className="font-display text-lg font-bold pf-tabular text-[var(--pf-primary)]">
              {fmt(ledgerTotal)}
            </div>
          </div>

          <div className="pf-card p-3">
            <p className="pf-label">Balance</p>
            <div
              className={`font-display text-lg font-bold pf-tabular ${
                balance > 0
                  ? "text-[var(--pf-danger)]"
                  : "text-[var(--pf-success)]"
              }`}
            >
              {fmt(balance)}
            </div>
          </div>
        </div>

        {canWrite && (
          <div className="pf-card p-4 space-y-3" data-testid="payment-add-form">
            <p className="pf-label">Add Installment</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-neutral-500">
                  Amount (₹)
                </Label>

                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="payment-input-amount"
                  className="mt-1 bg-white"
                  placeholder="0"
                />
              </div>

              <div>
                <Label className="text-xs text-neutral-500">Mode</Label>

                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger
                    data-testid="payment-input-mode"
                    className="mt-1 bg-white"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-neutral-500">Date</Label>

                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="payment-input-date"
                  className="mt-1 bg-white"
                />
              </div>

              <div>
                <Label className="text-xs text-neutral-500">Note</Label>

                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="payment-input-notes"
                  className="mt-1 bg-white"
                  placeholder="e.g. Round 2"
                />
              </div>
            </div>

            <Button
              onClick={addPayment}
              disabled={busy}
              data-testid="payment-add-button"
              className="pf-btn-primary rounded-full gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {busy ? "Adding…" : "Add Payment"}
            </Button>
          </div>
        )}

        <div>
          <p className="pf-label mb-2">Installments Recorded</p>

          {rows.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              No additional payments yet.
            </p>
          ) : (
            <div className="max-h-56 overflow-auto pf-card divide-y">
              {rows.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                  data-testid={`payment-row-${p.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="pf-tabular font-medium">
                      {fmt(p.amount)}
                    </span>

                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">
                      {p.mode}
                    </span>

                    <span className="text-xs text-neutral-500 pf-tabular">
                      {p.date}
                    </span>

                    {p.notes && (
                      <span className="text-xs text-neutral-500 italic">
                        {p.notes}
                      </span>
                    )}
                  </div>

                  {canWrite && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removePayment(p.id)}
                      data-testid={`payment-delete-${p.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--pf-danger)]" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}