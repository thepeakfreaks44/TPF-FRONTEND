import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Check, X, Coffee } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_META = {
  present: { label: "Present", color: "bg-[var(--pf-success)] text-white", icon: Check },
  absent: { label: "Absent", color: "bg-[var(--pf-danger)] text-white", icon: X },
  half_day: { label: "Half Day", color: "bg-[var(--pf-warning)] text-white", icon: Coffee },
  leave: { label: "Leave", color: "bg-neutral-400 text-white", icon: Coffee },
};

export default function Attendance() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [staff, setStaff] = useState([]);
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, a] = await Promise.all([
      api.get("/staff"),
      api.get(`/attendance?date=${date}`),
    ]);

    setStaff(s.data.filter((x) => x.is_active));
    setRecords(a.data);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (staff_id, status) => {
    if (busy) return;

    setBusy(true);

    try {
      await api.post("/attendance", {
        staff_id,
        date,
        status,
      });

      toast.success("Marked");

      load();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const map = Object.fromEntries(records.map((r) => [r.staff_id, r]));

  const summary = {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    half_day: records.filter((r) => r.status === "half_day").length,
    leave: records.filter((r) => r.status === "leave").length,
    unmarked: staff.filter((s) => !map[s.id]).length,
  };

  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Team</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Staff Attendance
          </h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">
            Mark daily attendance — feeds per-day wage into today's salary expense.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Label className="pf-label">Date</Label>

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="attendance-date"
            className="w-44 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Present", summary.present, "text-[var(--pf-success)]"],
          ["Absent", summary.absent, "text-[var(--pf-danger)]"],
          ["Half Day", summary.half_day, "text-[var(--pf-warning)]"],
          ["Leave", summary.leave, "text-neutral-500"],
          ["Unmarked", summary.unmarked, "text-neutral-400"],
        ].map(([lbl, val, cls]) => (
          <div className="pf-card p-4" key={lbl}>
            <p className="pf-label">{lbl}</p>
            <div className={`font-display text-2xl font-bold pf-tabular mt-1 ${cls}`}>
              {val}
            </div>
          </div>
        ))}
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Staff", "Role", "Wage", "Status", "Actions"].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  No active staff to mark attendance for.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((s) => {
                const rec = map[s.id];
                const meta = rec ? STATUS_META[rec.status] : null;

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>

                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">
                        {s.role}
                      </span>
                    </TableCell>

                    <TableCell className="pf-tabular text-sm text-neutral-600">
                      {s.salary_type === "per_day"
                        ? `₹${s.salary_rate}/day`
                        : `₹${s.salary_rate}/mo`}
                    </TableCell>

                    <TableCell>
                      {meta ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${meta.color}`}
                        >
                          <meta.icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          Not marked
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {canWrite ? (
                        <div className="flex gap-1 flex-wrap">
                          {["present", "absent", "half_day", "leave"].map((st) => (
                            <Button
                              key={st}
                              size="sm"
                              variant="outline"
                              onClick={() => mark(s.id, st)}
                              className={`h-7 px-2 text-xs ${
                                rec?.status === st
                                  ? "border-[var(--pf-primary)] text-[var(--pf-primary)]"
                                  : ""
                              }`}
                            >
                              {STATUS_META[st].label}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          Read only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}