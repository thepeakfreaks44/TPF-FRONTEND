import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Backpack, Truck, HardHat, Wallet,
  UserCog, Mountain, LogOut, MapPin, CalendarCheck, Receipt,
  FileBarChart, Settings, DatabaseBackup, Car,
} from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { section: "OVERVIEW", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", end: true },
    { to: "/reports", label: "Reports", icon: FileBarChart, testid: "nav-reports" },
  ]},
  { section: "OPERATIONS", items: [
    { to: "/clients", label: "Bookings", icon: Users, testid: "nav-clients" },
    { to: "/trek-schedules", label: "Trek Management", icon: MapPin, testid: "nav-trek-schedules" },
    { to: "/treks", label: "Trek Catalog", icon: Mountain, testid: "nav-treks" },
    { to: "/gear", label: "Rental Gear", icon: Backpack, testid: "nav-gear" },
    { to: "/rentals", label: "Rentals", icon: Backpack, testid: "nav-rentals" },
  ]},
  { section: "TRANSPORT", items: [
    { to: "/transport", label: "Transport Trips", icon: Truck, testid: "nav-transport" },
    { to: "/fleet", label: "Fleet Registry", icon: Car, testid: "nav-fleet" },
  ]},
  { section: "TEAM", items: [
    { to: "/staff", label: "Staff", icon: HardHat, testid: "nav-staff" },
    { to: "/guides", label: "Guides Duty", icon: MapPin, testid: "nav-guides" },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck, testid: "nav-attendance" },
    { to: "/salaries", label: "Salaries", icon: Wallet, testid: "nav-salaries" },
  ]},
  { section: "FINANCE", items: [
    { to: "/expenses", label: "Expenses", icon: Receipt, testid: "nav-expenses" },
  ]},
  { section: "SYSTEM", items: [
    { to: "/users", label: "User Access", icon: UserCog, testid: "nav-users", adminOnly: true },
    { to: "/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
    { to: "/backup", label: "Backup", icon: DatabaseBackup, testid: "nav-backup", adminOnly: true },
  ]},
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const doLogout = async () => {
    await logout();
    toast.success("Logged out.");
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[var(--pf-bg)]">
      <aside className="pf-sidebar w-64 shrink-0 hidden md:flex flex-col text-white sticky top-0 h-screen no-print">
        <div className="p-5 flex items-center gap-2 border-b border-white/10">
          <div className="h-9 w-9 rounded-md bg-[var(--pf-primary)] grid place-items-center">
            <Mountain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight leading-tight">THE PEAK</div>
            <div className="font-display text-sm font-bold tracking-tight leading-tight text-[var(--pf-primary)]">FREAKS</div>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          {NAV.map((sec) => (
            <div key={sec.section} className="mb-3">
              <p className="pf-label text-white/40 px-3 pt-2 pb-2">{sec.section}</p>
              {sec.items.filter((n) => !n.adminOnly || user?.role === "admin").map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  data-testid={item.testid}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 text-sm transition-colors duration-200 ${
                      isActive ? "bg-[var(--pf-primary)] text-white"
                               : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center font-display font-bold">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="pf-label text-white/40 mt-0.5">{user?.role}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={doLogout} data-testid="logout-button"
                    className="text-white/70 hover:text-white hover:bg-white/10" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[var(--pf-border)] no-print">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="md:hidden flex items-center gap-2">
              <Mountain className="h-5 w-5 text-[var(--pf-primary)]" />
              <span className="font-display font-bold">THE PEAK FREAKS</span>
            </div>
            <div className="hidden md:flex items-center gap-2 pf-label">
              <span className="text-neutral-400">Operations</span>
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-700">ERP Portal</span>
            </div>
            <div className="text-xs text-neutral-500 pf-tabular hidden sm:block">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
