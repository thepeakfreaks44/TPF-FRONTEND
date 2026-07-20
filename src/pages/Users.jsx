import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

const EMPTY = { email: "", password: "", name: "", role: "staff" };

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/auth/users").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.post("/auth/users", form);
      toast.success("User created");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await api.delete(`/auth/users/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatApiError(e?.response?.data?.detail)); }
  };

  const roleColor = { admin: "bg-[var(--pf-primary)] text-white", manager: "bg-[var(--pf-info)] text-white", staff: "bg-neutral-200 text-neutral-800" };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pf-label mb-1">Access Control</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">User Access</h1>
          <p className="text-sm text-[var(--pf-muted)] mt-1">Create logins for your team — admin, manager, or staff.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-button" onClick={() => { setForm(EMPTY); setOpen(true); }} className="pf-btn-primary rounded-full gap-1.5">
              <Plus className="h-4 w-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle className="font-display">New User</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="pf-label">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-input-name" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-input-email" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-input-password" className="mt-1.5 bg-white" />
              </div>
              <div>
                <Label className="pf-label">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="user-input-role" className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="pf-btn-primary rounded-full" onClick={save} data-testid="user-save">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pf-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Email", "Role", ""].map((h) => (
                <TableHead key={h} className="pf-label text-neutral-500">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} data-testid={`user-row-${r.id}`}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${roleColor[r.role]}`}>{r.role}</span></TableCell>
                <TableCell className="text-right">
                  {r.id !== user?.id && (
                    <Button size="icon" variant="ghost" onClick={() => del(r.id)} data-testid={`user-delete-${r.id}`}>
                      <Trash2 className="h-4 w-4 text-[var(--pf-danger)]" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
