import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Users, Car } from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const T_EMPTY = { name: "", phone: "", address: "", notes: "" };
const V_EMPTY = { vehicle_no: "", vehicle_type: "SUV", driver_name: "", driver_phone: "", transporter_id: "", seat_capacity: 6, is_active: true, notes: "" };

export default function TransportRegistry() {
  const { user } = useAuth();
  const canWrite = user?.role !== "staff";
  const [tab, setTab] = useState("vehicles");
  const [transporters, setTransporters] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [tOpen, setTOpen] = useState(false);
  const [tForm, setTForm] = useState(T_EMPTY);
  const [tEditing, setTEditing] = useState(null);

  const [vOpen, setVOpen] = useState(false);
  const [vForm, setVForm] = useState(V_EMPTY);
  const [vEditing, setVEditing] = useState(null);

  const load = async () => {
    const [t, v] = await Promise.all([api.get("/transporters"), api.get("/vehicles")]);
    setTransporters(t.data); setVehicles(v.data);
  };
  useEffect(() => { load(); }, []);

  // Transporter actions
  const tSave = async () => {
    try {
      if (tEditing) await api.put(`/transporters/${tEditing}`, tForm);
      else await api.post("/transporters", tForm);
      toast.success("Saved"); setTOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const tDel = async (id) => {
    if (!confirm("Delete transporter?")) return;
    await api.delete(`/transporters/${id}`); toast.success("Deleted"); load();
  };

  // Vehicle actions
  const vSave = async () => {
    try {
      const body = { ...vForm, seat_capacity: Number(vForm.seat_capacity) || 0, transporter_id: vForm.transporter_id || null };
      if (vEditing) await api.put(`/vehicles/${vEditing}`, body);
      else await api.post("/vehicles", body);
      toast.success("Saved"); setVOpen(false); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const vDel = async (id) => {
    if (!confirm("Delete vehicle?")) return;
    await api.delete(`/vehicles/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6" data-testid="transport-registry-page">
      <div>
        <p className="pf-label mb-1">Fleet Registry</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Vehicles &amp; Transporters</h1>
        <p className="text-sm text-[var(--pf-muted)] mt-1">Master list — actual trips are logged under "Transport".</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button data-testid="tab-vehicles" onClick={() => setTab("vehicles")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "vehicles" ? "border-[var(--pf-primary)] text-[var(--pf-primary)]" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
          <span className="inline-flex items-center gap-1.5"><Car className="h-4 w-4" /> Vehicles ({vehicles.length})</span>
        </button>
        <button data-testid="tab-transporters" onClick={() => setTab("transporters")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "transporters" ? "border-[var(--pf-primary)] text-[var(--pf-primary)]" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Transporters ({transporters.length})</span>
        </button>
      </div>

      {tab === "vehicles" && (
        <>
          <div className="flex justify-end">
            <Dialog open={vOpen} onOpenChange={setVOpen}>
              {canWrite && (
                <DialogTrigger asChild>
                  <Button onClick={() => { setVForm(V_EMPTY); setVEditing(null); setVOpen(true); }}
                          data-testid="add-vehicle-button" className="pf-btn-primary rounded-full gap-1.5">
                    <Plus className="h-4 w-4" /> Add Vehicle
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="bg-white max-w-lg">
                <DialogHeader><DialogTitle className="font-display">{vEditing ? "Edit Vehicle" : "New Vehicle"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="pf-label">Vehicle Number</Label><Input value={vForm.vehicle_no} onChange={(e) => setVForm({ ...vForm, vehicle_no: e.target.value })} data-testid="vehicle-input-vehicle_no" className="mt-1.5 bg-white" /></div>
                  <div><Label className="pf-label">Type</Label><Input value={vForm.vehicle_type} onChange={(e) => setVForm({ ...vForm, vehicle_type: e.target.value })} data-testid="vehicle-input-vehicle_type" className="mt-1.5 bg-white" placeholder="SUV / Bus / Tempo" /></div>
                  <div><Label className="pf-label">Driver Name</Label><Input value={vForm.driver_name} onChange={(e) => setVForm({ ...vForm, driver_name: e.target.value })} data-testid="vehicle-input-driver_name" className="mt-1.5 bg-white" /></div>
                  <div><Label className="pf-label">Driver Phone</Label><Input value={vForm.driver_phone} onChange={(e) => setVForm({ ...vForm, driver_phone: e.target.value })} data-testid="vehicle-input-driver_phone" className="mt-1.5 bg-white" /></div>
                  <div><Label className="pf-label">Seat Capacity</Label><Input type="number" value={vForm.seat_capacity} onChange={(e) => setVForm({ ...vForm, seat_capacity: e.target.value })} data-testid="vehicle-input-seat_capacity" className="mt-1.5 bg-white" /></div>
                  <div>
                    <Label className="pf-label">Transporter</Label>
                    <Select value={vForm.transporter_id || "none"} onValueChange={(x) => setVForm({ ...vForm, transporter_id: x === "none" ? "" : x })}>
                      <SelectTrigger data-testid="vehicle-input-transporter_id" className="mt-1.5 bg-white"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none">— None —</SelectItem>
                        {transporters.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border rounded-md px-3 py-2">
                    <div><Label className="pf-label">Active</Label><p className="text-xs text-neutral-500">Available for trips</p></div>
                    <Switch checked={!!vForm.is_active} onCheckedChange={(v) => setVForm({ ...vForm, is_active: v })} data-testid="vehicle-input-is_active" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setVOpen(false)}>Cancel</Button>
                  <Button className="pf-btn-primary rounded-full" onClick={vSave} data-testid="vehicle-save">{vEditing ? "Update" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="pf-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>{["Vehicle", "Type", "Driver", "Transporter", "Seats", "Status", ""].map((h) => (<TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>))}</TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                    <Car className="h-8 w-8 mx-auto mb-2 text-neutral-300" /> No vehicles registered.
                  </TableCell></TableRow>
                ) : vehicles.map((v) => (
                  <TableRow key={v.id} data-testid={`vehicle-row-${v.id}`}>
                    <TableCell className="font-medium">{v.vehicle_no}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{v.vehicle_type}</span></TableCell>
                    <TableCell><div>{v.driver_name || "—"}</div><div className="text-xs text-neutral-500">{v.driver_phone || ""}</div></TableCell>
                    <TableCell>{v.transporter_name || <span className="text-neutral-400">—</span>}</TableCell>
                    <TableCell className="pf-tabular">{v.seat_capacity}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${v.is_active ? "bg-[var(--pf-success)]/10 text-[var(--pf-success)]" : "bg-neutral-100 text-neutral-500"}`}>{v.is_active ? "ACTIVE" : "INACTIVE"}</span></TableCell>
                    <TableCell className="text-right">
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => { setVEditing(v.id); setVForm({ ...V_EMPTY, ...v }); setVOpen(true); }} data-testid={`vehicle-edit-${v.id}`}><Pencil className="h-4 w-4" /></Button>}
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => vDel(v.id)} data-testid={`vehicle-delete-${v.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {tab === "transporters" && (
        <>
          <div className="flex justify-end">
            <Dialog open={tOpen} onOpenChange={setTOpen}>
              {canWrite && (
                <DialogTrigger asChild>
                  <Button onClick={() => { setTForm(T_EMPTY); setTEditing(null); setTOpen(true); }}
                          data-testid="add-transporter-button" className="pf-btn-primary rounded-full gap-1.5">
                    <Plus className="h-4 w-4" /> Add Transporter
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle className="font-display">{tEditing ? "Edit Transporter" : "New Transporter"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 gap-4">
                  <div><Label className="pf-label">Name</Label><Input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} data-testid="transporter-input-name" className="mt-1.5 bg-white" /></div>
                  <div><Label className="pf-label">Phone</Label><Input value={tForm.phone} onChange={(e) => setTForm({ ...tForm, phone: e.target.value })} data-testid="transporter-input-phone" className="mt-1.5 bg-white" /></div>
                  <div><Label className="pf-label">Address</Label><Input value={tForm.address} onChange={(e) => setTForm({ ...tForm, address: e.target.value })} data-testid="transporter-input-address" className="mt-1.5 bg-white" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTOpen(false)}>Cancel</Button>
                  <Button className="pf-btn-primary rounded-full" onClick={tSave} data-testid="transporter-save">{tEditing ? "Update" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="pf-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>{["Name", "Phone", "Address", ""].map((h) => (<TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>))}</TableRow>
              </TableHeader>
              <TableBody>
                {transporters.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-neutral-400 text-sm">No transporters yet.</TableCell></TableRow>
                ) : transporters.map((t) => (
                  <TableRow key={t.id} data-testid={`transporter-row-${t.id}`}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.phone || "—"}</TableCell>
                    <TableCell>{t.address || "—"}</TableCell>
                    <TableCell className="text-right">
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => { setTEditing(t.id); setTForm({ ...T_EMPTY, ...t }); setTOpen(true); }} data-testid={`transporter-edit-${t.id}`}><Pencil className="h-4 w-4" /></Button>}
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => tDel(t.id)} data-testid={`transporter-delete-${t.id}`}><Trash2 className="h-4 w-4 text-[var(--pf-danger)]" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
