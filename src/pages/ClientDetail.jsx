import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Copy, Download, Printer, Building2, Phone, Mail, MapPin, Backpack, Truck, Receipt } from "lucide-react";
import { toast } from "sonner";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function ClientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/clients/${id}/summary`).then((r) => setData(r.data)).catch(() => setData(null));
  }, [id]);

  if (!data) return <div className="pf-label animate-pulse">Loading…</div>;
  const { client, rentals, transports, payments, totals } = data;

  const buildMaster = () => {
    const lines = [
      `THE PEAK FREAKS — Master Statement`,
      `Client: ${client.name}`,
      client.company_name ? `Company: ${client.company_name}` : null,
      `Phone: ${client.phone || "—"}`,
      ``,
      `— TREK BOOKING —`,
      `${client.trek_name} (${client.start_date} → ${client.end_date})`,
      `Pax: ${client.people_count}   Amount: ${fmt(client.trek_amount)}   Paid: ${fmt(client.paid_amount)}   Balance: ${fmt(client.balance)}`,
    ];
    if (rentals.length) {
      lines.push(``, `— RENTALS (${rentals.length}) —`);
      rentals.forEach((r) => lines.push(`• ${r.gear_name} x${r.qty} — ${r.days} days — ${fmt(r.total_amount)} (paid ${fmt(r.paid_amount)})`));
    }
    if (transports.length) {
      lines.push(``, `— TRANSPORT (${transports.length}) —`);
      transports.forEach((t) => lines.push(`• ${t.vehicle_no} · ${t.route || t.pickup + "→" + t.drop} — ${fmt(t.total_amount)} (paid ${fmt(t.paid_amount)})`));
    }
    lines.push(``, `— SUMMARY —`,
      `Grand Total:   ${fmt(totals.grand_total)}`,
      `Grand Paid:    ${fmt(totals.grand_paid)}`,
      `Balance Due:   ${fmt(totals.grand_balance)}`,
      ``, `Thank you for choosing THE PEAK FREAKS.`);
    return lines.filter((l) => l != null).join("\n");
  };

  const copyMaster = async () => {
    try { await navigator.clipboard.writeText(buildMaster()); toast.success("Master statement copied"); }
    catch { toast.error("Copy failed"); }
  };
  const shareWhatsApp = () => {
    const num = (client.phone || "").replace(/\D+/g, "");
    const text = buildMaster();
    const url = num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const downloadInvoicePdf = async () => {
    const t = localStorage.getItem("pf_token") || "";
    const res = await fetch(`${API}/invoice/client/${id}/pdf`, { headers: { Authorization: `Bearer ${t}` } });
    const blob = await res.blob();
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `invoice_${client.name}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const doPrint = () => window.print();

  const STATUS_META = {
    confirmed: "bg-[var(--pf-success)]/10 text-[var(--pf-success)]",
    pending: "bg-[var(--pf-warning)]/10 text-[var(--pf-warning)]",
    completed: "bg-neutral-100 text-neutral-700",
    cancelled: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
  };

  return (
    <div className="space-y-6" data-testid="client-detail-page">
      <div className="flex items-center justify-between no-print">
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900" data-testid="back-to-clients">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={copyMaster} data-testid="master-copy" className="gap-1.5"><Copy className="h-4 w-4" /> Copy</Button>
          <Button size="sm" variant="outline" onClick={doPrint} data-testid="master-print" className="gap-1.5"><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" variant="outline" onClick={downloadInvoicePdf} data-testid="master-pdf" className="gap-1.5"><Download className="h-4 w-4" /> Invoice PDF</Button>
          <Button size="sm" onClick={shareWhatsApp} data-testid="master-whatsapp" className="gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white">
            <MessageCircle className="h-4 w-4" /> Master WhatsApp
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="pf-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="pf-label">Client 360</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">{client.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              {client.company_name && <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {client.company_name}</span>}
              {client.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {client.phone}</span>}
              {client.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {client.email}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_META[client.booking_status || "confirmed"]}`}>{client.booking_status || "confirmed"}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <div><p className="pf-label">Grand Total</p><div className="font-display text-xl font-bold pf-tabular">{fmt(totals.grand_total)}</div></div>
            <div><p className="pf-label">Paid</p><div className="font-display text-xl font-bold pf-tabular text-[var(--pf-primary)]">{fmt(totals.grand_paid)}</div></div>
            <div><p className="pf-label">Balance</p><div className={`font-display text-xl font-bold pf-tabular ${totals.grand_balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(totals.grand_balance)}</div></div>
          </div>
        </div>
      </div>

      {/* Trek booking */}
      <div className="pf-card p-6" data-testid="section-trek">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-[var(--pf-primary)]" />
          <p className="pf-label">Trek Booking</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div><p className="pf-label">Trek</p><div className="font-medium mt-1">{client.trek_name}</div></div>
          <div><p className="pf-label">Dates</p><div className="pf-tabular text-sm mt-1">{client.start_date} → {client.end_date}</div></div>
          <div><p className="pf-label">Pax</p><div className="font-display text-lg font-bold pf-tabular mt-1">{client.people_count}</div></div>
          <div><p className="pf-label">Amount</p><div className="font-display text-lg font-bold pf-tabular mt-1">{fmt(client.trek_amount)}</div></div>
          <div><p className="pf-label">Paid</p><div className="font-display text-lg font-bold pf-tabular mt-1 text-[var(--pf-primary)]">{fmt(client.paid_amount)}</div></div>
          <div><p className="pf-label">Balance</p><div className={`font-display text-lg font-bold pf-tabular mt-1 ${client.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(client.balance)}</div></div>
        </div>
      </div>

      {/* Rentals */}
      <div className="pf-card p-6" data-testid="section-rentals">
        <div className="flex items-center gap-2 mb-3">
          <Backpack className="h-4 w-4 text-[var(--pf-primary)]" />
          <p className="pf-label">Gear Rentals ({rentals.length})</p>
        </div>
        {rentals.length === 0 ? <p className="text-sm text-neutral-400">No rentals linked.</p> : (
          <ul className="divide-y divide-neutral-100">
            {rentals.map((r) => (
              <li key={r.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.gear_name} <span className="text-xs text-neutral-500">×{r.qty}</span></div>
                  <div className="text-xs text-neutral-500 pf-tabular">{r.rent_date} → {r.return_date} · {r.days} days · ₹{r.daily_rate}/day</div>
                </div>
                <div className="text-right">
                  <div className="pf-tabular font-medium">{fmt(r.total_amount)}</div>
                  <div className="text-xs text-neutral-500">Paid {fmt(r.paid_amount)} · Bal {fmt(r.balance)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transport */}
      <div className="pf-card p-6" data-testid="section-transport">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-4 w-4 text-[var(--pf-primary)]" />
          <p className="pf-label">Transport ({transports.length})</p>
        </div>
        {transports.length === 0 ? <p className="text-sm text-neutral-400">No transport trips linked.</p> : (
          <ul className="divide-y divide-neutral-100">
            {transports.map((t) => (
              <li key={t.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.vehicle_no} · {t.route || `${t.pickup || "—"} → ${t.drop || "—"}`}</div>
                  <div className="text-xs text-neutral-500 pf-tabular">{t.start_date} → {t.end_date} · {t.driver_name || "—"} {t.rounds ? `· ${t.rounds} rounds × ${fmt(t.rate_per_round)}` : `· ${fmt(t.price_per_day)}/day`}</div>
                </div>
                <div className="text-right">
                  <div className="pf-tabular font-medium">{fmt(t.total_amount)}</div>
                  <div className="text-xs text-neutral-500">Paid {fmt(t.paid_amount)} · Bal {fmt(t.balance)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payments */}
      <div className="pf-card p-6" data-testid="section-payments">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="h-4 w-4 text-[var(--pf-primary)]" />
          <p className="pf-label">Payment Ledger ({payments.length})</p>
        </div>
        {payments.length === 0 ? <p className="text-sm text-neutral-400">No ledger payments recorded.</p> : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="py-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="pf-tabular font-medium">{fmt(p.amount)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{p.mode}</span>
                  <span className="text-xs text-neutral-500 pf-tabular">{p.date}</span>
                </div>
                <span className="text-xs text-neutral-500 italic">{p.notes}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
