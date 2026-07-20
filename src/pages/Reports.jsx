import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, FileSpreadsheet, FileDown } from "lucide-react";
import { API } from "@/lib/api";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const PRESETS = [
  { key: "today", label: "Today", start: today(), end: today() },
  { key: "week", label: "Last 7 Days", start: daysAgo(6), end: today() },
  { key: "month", label: "This Month", start: today().slice(0, 8) + "01", end: today() },
  { key: "30d", label: "Last 30 Days", start: daysAgo(29), end: today() },
];

function KV({ label, value, tone }) {
  const cls = tone === "danger" ? "text-[var(--pf-danger)]" : tone === "success" ? "text-[var(--pf-success)]" : tone === "primary" ? "text-[var(--pf-primary)]" : "";
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-neutral-200 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className={`font-display font-bold pf-tabular ${cls}`}>{value}</span>
    </div>
  );
}

function Card({ title, subtitle, children, testid }) {
  return (
    <div className="pf-card p-5" data-testid={testid}>
      <p className="pf-label">{subtitle}</p>
      <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default function Reports() {
  const [start, setStart] = useState(daysAgo(6));
  const [end, setEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/reports/summary?start=${start}&end=${end}`);
      setData(r.data);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const exportUrl = (entity, fmtType) => `${API}/export/${entity}.${fmtType}`;
  const downloadWithAuth = async (url, filename) => {
    const t = localStorage.getItem("pf_token") || "";
    const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
    const blob = await r.blob();
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = filename;
    document.body.appendChild(a); 
    a.click(); 
    a.remove();
  };

  const doPrint = () => window.print();

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <p className="pf-label mb-1">Reports</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Aggregate view across bookings, rentals, transport, expenses and salaries.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <Label className="pf-label">From</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} data-testid="report-start" className="w-40 mt-1 bg-white" />
          </div>
          <div>
            <Label className="pf-label">To</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} data-testid="report-end" className="w-40 mt-1 bg-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        {PRESETS.map((p) => (
          <Button key={p.key} size="sm" variant="outline"
                  onClick={() => { setStart(p.start); setEnd(p.end); }}
                  data-testid={`report-preset-${p.key}`}
                  className={start === p.start && end === p.end ? "border-[var(--pf-primary)] text-[var(--pf-primary)]" : ""}>
            {p.label}
          </Button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={doPrint} data-testid="report-print" className="gap-1.5">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {loading || !data ? (
        <div className="pf-label animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-6" id="report-content">
          <div className="pf-card p-6 print-header hidden">
            <h1 className="font-display text-2xl font-bold">THE PEAK FREAKS</h1>
            <p className="text-sm text-neutral-500">Report: {data.range.start} to {data.range.end}</p>
          </div>

          {/* Headline KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="pf-card p-5"><p className="pf-label">Income</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-success)]">{fmt(data.totals.income)}</div></div>
            <div className="pf-card p-5"><p className="pf-label">Expenses</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-danger)]">{fmt(data.totals.expenses)}</div></div>
            <div className="pf-card p-5 bg-[var(--pf-sidebar)] text-white"><p className="pf-label text-white/60">Net Profit</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(data.totals.net_profit)}</div></div>
            <div className="pf-card p-5 bg-[var(--pf-primary)] text-white"><p className="pf-label text-white/70">Collected</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{fmt(data.bookings.total_collection)}</div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card testid="report-bookings" subtitle="Bookings" title="Trek Bookings">
              <KV label="Total Bookings" value={data.bookings.count} />
              <KV label="Total Pax" value={data.bookings.total_pax} />
              <KV label="Package Amount" value={fmt(data.bookings.package_amount)} />
              <KV label="Advance Received" value={fmt(data.bookings.advance_received)} tone="primary" />
              <KV label="Remaining" value={fmt(data.bookings.remaining)} tone="danger" />
              <KV label="Cash" value={fmt(data.bookings.cash)} />
              <KV label="Online" value={fmt(data.bookings.online)} />
            </Card>

            <Card testid="report-rentals" subtitle="Rentals" title="Gear Rentals">
              <KV label="Rentals" value={data.rentals.count} />
              <KV label="Total Value" value={fmt(data.rentals.total)} />
              <KV label="Collected" value={fmt(data.rentals.collected)} tone="primary" />
              <KV label="Pending" value={fmt(data.rentals.pending)} tone="danger" />
            </Card>

            <Card testid="report-transport" subtitle="Transport" title="Vehicle Trips">
              <KV label="Trips" value={data.transport.count} />
              <KV label="Total Rounds" value={data.transport.total_rounds} />
              <KV label="Total Value" value={fmt(data.transport.total)} />
              <KV label="Paid Out" value={fmt(data.transport.paid)} tone="danger" />
              <KV label="Pending" value={fmt(data.transport.pending)} />
            </Card>

            <Card testid="report-expenses" subtitle="Expenses" title="Other Expenses">
              <KV label="Entries" value={data.expenses.count} />
              <KV label="Total" value={fmt(data.expenses.total)} tone="danger" />
            </Card>

            <Card testid="report-salaries" subtitle="Payroll" title="Salaries">
              <KV label="Paid" value={fmt(data.salaries.paid)} tone="danger" />
            </Card>

            <Card testid="report-net" subtitle="P&L" title="Net Position">
              <KV label="Total Income" value={fmt(data.totals.income)} tone="success" />
              <KV label="Total Expenses" value={fmt(data.totals.expenses)} tone="danger" />
              <div className="pt-3 mt-2 border-t">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs pf-label">Net Profit</span>
                  <span className={`font-display text-2xl font-bold pf-tabular ${data.totals.net_profit >= 0 ? "text-[var(--pf-success)]" : "text-[var(--pf-danger)]"}`}>{fmt(data.totals.net_profit)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Downloads per entity */}
          <div className="pf-card p-5 no-print">
            <p className="pf-label mb-3">Detailed Exports</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {["clients", "rentals", "transport", "staff", "salaries"].map((ent) => (
                <div key={ent} className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1"
                          onClick={() => downloadWithAuth(exportUrl(ent, "xlsx"), `pf_${ent}.xlsx`)}
                          data-testid={`report-download-${ent}-xlsx`}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> {ent} · xlsx
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => downloadWithAuth(exportUrl(ent, "pdf"), `pf_${ent}.pdf`)}
                          data-testid={`report-download-${ent}-pdf`}>
                    <FileDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}