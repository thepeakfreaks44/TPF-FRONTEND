import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Wallet, Truck, HardHat, TrendingUp, Coins, Landmark, Backpack,
  Receipt, TrendingDown, UserCheck, UserX, MapPin, Package,
} from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function Kpi({ label, value, icon: Icon, sub, testid, tone = "default" }) {
  const toneMap = {
    default: "bg-white",
    primary: "bg-[var(--pf-primary)] text-white",
    dark: "bg-[var(--pf-sidebar)] text-white",
    success: "bg-[var(--pf-success)] text-white",
    danger: "bg-[var(--pf-danger)] text-white",
  };
  return (
    <div data-testid={testid} className={`pf-card pf-card-hover p-5 flex flex-col justify-between ${toneMap[tone]}`}>
      <div className="flex items-start justify-between">
        <p className={`pf-label ${tone !== "default" ? "text-white/70" : ""}`}>{label}</p>
        <div className={`h-8 w-8 rounded-md grid place-items-center ${tone === "default" ? "bg-neutral-100" : "bg-white/10"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="font-display text-2xl font-bold pf-tabular leading-none">{value}</div>
        {sub && <div className={`text-xs mt-2 ${tone !== "default" ? "text-white/70" : "text-neutral-500"}`}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [todayList, setTodayList] = useState([]);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setData(r.data));
    api.get("/dashboard/today-bookings").then((r) => setTodayList(r.data)).catch(() => setTodayList([]));
  }, []);

  if (!data) return <div className="pf-label animate-pulse">Loading dashboard…</div>;

  const pie = [
    { name: "Cash", value: data.today.revenue_cash || 0, color: "#161616" },
    { name: "Online / UPI / Card", value: data.today.revenue_online || 0, color: "#D95C41" },
  ];
  const showPie = pie.some((p) => p.value > 0);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Command Center</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">
            Live snapshot of today's operations at THE PEAK FREAKS.
          </p>
        </div>
      </div>

      {/* Today's booking KPIs */}
      <div>
        <p className="pf-label mb-2">Today's Bookings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger-in">
          <Kpi label="Bookings" value={data.today.new_clients} icon={Users} testid="kpi-today-clients" />
          <Kpi label="Pax" value={data.today.pax} icon={UserCheck} testid="kpi-today-pax" />
          <Kpi label="Package" value={fmt(data.today.package_amount)} icon={Package} testid="kpi-today-package" />
          <Kpi label="Advance" value={fmt(data.today.advance)} icon={Coins} testid="kpi-today-advance" tone="primary" />
          <Kpi label="Remaining" value={fmt(data.today.remaining)} icon={TrendingDown} testid="kpi-today-remaining" tone={data.today.remaining > 0 ? "danger" : "default"} />
        </div>
      </div>

      {/* Cash flow today */}
      <div>
        <p className="pf-label mb-2">Today's Cash Flow</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi label="Cash" value={fmt(data.today.revenue_cash)} icon={Coins} testid="kpi-today-cash" />
          <Kpi label="Online" value={fmt(data.today.revenue_online)} icon={Landmark} testid="kpi-today-online" />
          <Kpi label="Total Collection" value={fmt(data.today.revenue_total)} icon={TrendingUp} testid="kpi-today-total" tone="primary" />
          <Kpi label="Expenses" value={fmt(data.today.expenses)} icon={Receipt} testid="kpi-today-expenses" tone={data.today.expenses > 0 ? "danger" : "default"} />
          <Kpi label="Wage Today" value={fmt(data.today.salary_expense)} icon={Wallet} testid="kpi-today-wage" />
          <Kpi label="Net Profit (all)" value={fmt(data.money.net_profit)} icon={TrendingUp} testid="kpi-net-profit" tone={data.money.net_profit >= 0 ? "success" : "danger"} />
        </div>
      </div>

      {/* Rental & Transport summary */}
      <div>
        <p className="pf-label mb-2">Rentals · Transport · Team</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi label="Rental Total" value={fmt(data.money.rental_total)} icon={Backpack} testid="kpi-rental-total" />
          <Kpi label="Rental Income" value={fmt(data.money.rental_income)} icon={Backpack} testid="kpi-rental-income" />
          <Kpi label="Rental Pending" value={fmt(data.money.rental_pending)} icon={Backpack} testid="kpi-rental-pending" tone={data.money.rental_pending > 0 ? "danger" : "default"} />
          <Kpi label="Transport Exp." value={fmt(data.money.transport_expense)} icon={Truck} testid="kpi-transport-expense" />
          <Kpi label="Active Guides" value={data.totals.active_guides} icon={MapPin} testid="kpi-active-guides" />
          <Kpi label="Active Treks" value={data.totals.active_schedules} icon={MapPin} testid="kpi-active-treks" />
        </div>
      </div>

      {/* Team + finance */}
      <div>
        <p className="pf-label mb-2">Team &amp; Business</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi label="Staff Present" value={data.totals.staff_present} icon={UserCheck} testid="kpi-staff-present" tone="success" />
          <Kpi label="Staff Absent" value={data.totals.staff_absent} icon={UserX} testid="kpi-staff-absent" tone={data.totals.staff_absent > 0 ? "danger" : "default"} />
          <Kpi label="Active Vehicles" value={data.totals.active_transport} icon={Truck} testid="kpi-active-transport" />
          <Kpi label="Total Income" value={fmt(data.money.total_income)} icon={TrendingUp} testid="kpi-total-income" tone="success" />
          <Kpi label="Total Expenses" value={fmt(data.money.total_expenses)} icon={TrendingDown} testid="kpi-total-expenses" tone="danger" />
          <Kpi label="Outstanding" value={fmt((data.outstanding.clients || 0) + (data.outstanding.rentals || 0) + (data.outstanding.transport || 0))} icon={Wallet} testid="kpi-outstanding" tone="dark" />
        </div>
      </div>

      {/* Today's Bookings table */}
      <div className="pf-card p-6" data-testid="today-bookings-table">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="pf-label">Today at a Glance</p>
            <h3 className="font-display text-xl font-bold">Today's Client Register</h3>
          </div>
          <span className="text-xs text-neutral-400 pf-tabular">{todayList.length} entries</span>
        </div>
        {todayList.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">No client bookings for today yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left pf-label text-neutral-500 border-b border-neutral-100">
                  <th className="py-2">Client</th>
                  <th className="py-2">Company</th>
                  <th className="py-2">Trek</th>
                  <th className="py-2 text-right">Pax</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Cash</th>
                  <th className="py-2 text-right">Online</th>
                  <th className="py-2 text-right">Balance</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayList.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100" data-testid={`today-row-${r.id}`}>
                    <td className="py-2.5">
                      <a href={`/clients/${r.id}`} className="font-medium hover:text-[var(--pf-primary)]">{r.name}</a>
                      <div className="text-xs text-neutral-500">{r.phone}</div>
                    </td>
                    <td className="py-2.5 text-neutral-600">{r.company_name || <span className="text-neutral-300">—</span>}</td>
                    <td className="py-2.5">{r.trek_name}</td>
                    <td className="py-2.5 pf-tabular text-right">{r.pax}</td>
                    <td className="py-2.5 pf-tabular text-right">{fmt(r.amount)}</td>
                    <td className="py-2.5 pf-tabular text-right font-medium">{fmt(r.cash)}</td>
                    <td className="py-2.5 pf-tabular text-right">{fmt(r.online)}</td>
                    <td className={`py-2.5 pf-tabular text-right ${r.balance > 0 ? "text-[var(--pf-danger)]" : "text-[var(--pf-success)]"}`}>{fmt(r.balance)}</td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="pf-card p-6 lg:col-span-2" data-testid="chart-revenue-trend">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="pf-label">7-Day Revenue Trend</p>
              <h3 className="font-display text-xl font-bold">Cash vs Online</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend_7d}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D95C41" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#D95C41" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#161616" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#161616" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="#999" />
                <YAxis fontSize={11} stroke="#999" />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5" }} />
                <Area type="monotone" dataKey="online" stroke="#D95C41" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="cash" stroke="#161616" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pf-card p-6" data-testid="chart-payment-split">
          <p className="pf-label">Today's Split</p>
          <h3 className="font-display text-xl font-bold mb-2">Payment Mode</h3>
          <div className="h-56">
            {showPie ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-neutral-400">
                No payments recorded today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="pf-card p-6" data-testid="active-transport-list">
          <div className="flex items-center justify-between mb-4">
            <p className="pf-label">Active Transport</p>
            <span className="text-xs text-neutral-400">{data.active_transport_list.length} trips</span>
          </div>
          {data.active_transport_list.length === 0 ? (
            <p className="text-sm text-neutral-400">No active vehicles right now.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.active_transport_list.map((t) => (
                <li key={t.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{t.vehicle_no} · {t.route || "—"}</div>
                    <div className="text-xs text-neutral-500">
                      {t.start_date} → {t.end_date} · {t.driver_name || "—"}
                    </div>
                  </div>
                  <span className="pf-tabular font-medium">{t.rounds ? `${t.rounds} rounds` : `${fmt(t.price_per_day)}/day`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pf-card p-6" data-testid="active-staff-list">
          <div className="flex items-center justify-between mb-4">
            <p className="pf-label">Active Staff</p>
            <span className="text-xs text-neutral-400">{data.active_staff_list.length} people</span>
          </div>
          {data.active_staff_list.length === 0 ? (
            <p className="text-sm text-neutral-400">No staff currently assigned.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.active_staff_list.map((s) => (
                <li key={s.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-neutral-500">{s.role} · {s.active_trek || "Available"}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--pf-success)]/10 text-[var(--pf-success)]">ACTIVE</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
