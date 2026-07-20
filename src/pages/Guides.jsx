import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardHat, Phone, MapPin, Calendar } from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const STATUS = {
  scheduled: "bg-[var(--pf-info)]/10 text-[var(--pf-info)]",
  active: "bg-[var(--pf-success)] text-white",
  completed: "bg-neutral-200 text-neutral-700",
  cancelled: "bg-[var(--pf-danger)]/10 text-[var(--pf-danger)]",
};

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [selected, setSelected] = useState(null);
  const [duty, setDuty] = useState(null);

  useEffect(() => { api.get("/guides").then((r) => setGuides(r.data)); }, []);
  useEffect(() => {
    if (!selected) { setDuty(null); return; }
    api.get(`/guides/${selected}/duty`).then((r) => setDuty(r.data));
  }, [selected]);

  return (
    <div className="space-y-6" data-testid="guides-page">
      <div>
        <p className="pf-label mb-1">Field Ops</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Guide Duty Management</h1>
        <p className="text-sm text-[var(--pf-muted)] mt-1">Guide-wise view of active duty, past treks, client count and payments.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pf-card p-4"><p className="pf-label">Total Guides</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{guides.length}</div></div>
        <div className="pf-card p-4"><p className="pf-label">On Duty</p><div className="font-display text-2xl font-bold pf-tabular mt-1 text-[var(--pf-success)]">{guides.filter((g) => g.current_duty).length}</div></div>
        <div className="pf-card p-4"><p className="pf-label">Total Treks Assigned</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{guides.reduce((s, g) => s + (g.total_treks || 0), 0)}</div></div>
        <div className="pf-card p-4"><p className="pf-label">Clients Handled</p><div className="font-display text-2xl font-bold pf-tabular mt-1">{guides.reduce((s, g) => s + (g.total_clients || 0), 0)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Guides list */}
        <div className="pf-card overflow-hidden lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>{["Guide", "Phone", "Current Duty", "Active", "Completed", "Clients", "Wage"].map((h) => (<TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>))}</TableRow>
            </TableHeader>
            <TableBody>
              {guides.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                  <HardHat className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  No staff with role "Guide" yet. Add them in Staff.
                </TableCell></TableRow>
              ) : guides.map((g) => (
                <TableRow key={g.id} onClick={() => setSelected(g.id)} className={`cursor-pointer ${selected === g.id ? "bg-[var(--pf-primary)]/5" : ""}`} data-testid={`guide-row-${g.id}`}>
                  <TableCell>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-neutral-500">{g.is_active ? "Active" : "Inactive"}</div>
                  </TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {g.phone || "—"}</span></TableCell>
                  <TableCell>
                    {g.current_duty ? (
                      <div>
                        <div className="text-sm font-medium">{g.current_duty.trek_name}</div>
                        <div className="text-xs text-neutral-500 pf-tabular">{g.current_duty.trek_date}</div>
                      </div>
                    ) : <span className="text-xs text-neutral-400">Available</span>}
                  </TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-[var(--pf-success)]/10 text-[var(--pf-success)]">{g.active_treks}</span></TableCell>
                  <TableCell className="pf-tabular text-neutral-600">{g.completed_treks}</TableCell>
                  <TableCell className="pf-tabular font-medium">{g.total_clients}</TableCell>
                  <TableCell className="pf-tabular text-sm">{fmt(g.salary_rate)}/{g.salary_type === "per_day" ? "day" : "mo"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Duty detail panel */}
        <div className="pf-card p-5" data-testid="guide-duty-panel">
          {!duty ? (
            <div className="text-sm text-neutral-400 h-full grid place-items-center py-16 text-center">
              Select a guide to view duty history &amp; payments.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="pf-label">Guide</p>
                <h3 className="font-display text-xl font-bold">{duty.guide.name}</h3>
                <p className="text-xs text-neutral-500">{duty.guide.phone || "—"} · {duty.guide.role}</p>
              </div>

              <div>
                <p className="pf-label mb-2">Duty History</p>
                {duty.schedules.length === 0 ? (
                  <p className="text-xs text-neutral-400">No duties assigned.</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-auto">
                    {duty.schedules.map((s) => (
                      <li key={s.id} className="border rounded-md p-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium">{s.trek_name}</div>
                            <div className="text-xs text-neutral-500 pf-tabular inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {s.trek_date}{s.end_date ? ` → ${s.end_date}` : ""}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS[s.status]}`}>{s.status}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 flex flex-wrap gap-3">
                          <span>Groups: {s.total_groups}</span>
                          <span>Pax: {s.total_pax}</span>
                          {s.vehicle_no && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.vehicle_no}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="pf-label mb-2">Salary Records</p>
                {duty.salary_records.length === 0 ? (
                  <p className="text-xs text-neutral-400">No salary records.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {duty.salary_records.map((s) => (
                      <li key={s.id} className="flex justify-between items-center border-b border-dashed border-neutral-200 py-1.5 last:border-0">
                        <span className="pf-tabular">{s.month}</span>
                        <div className="text-right">
                          <div className="pf-tabular font-medium">{fmt(s.gross_amount)}</div>
                          <div className="text-xs text-neutral-500">Paid {fmt(s.paid_amount)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
