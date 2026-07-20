import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { Mountain, Lock, User } from "lucide-react";

const BG_IMG =
  "https://images.unsplash.com/photo-1691958262703-8fdcf760d9b9?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@peakfreaks.com");
  const [password, setPassword] = useState("Peak@2026");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back to base camp.");
      nav("/", { replace: true });
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Left hero */}
      <div className="relative hidden lg:block">
        <img src={BG_IMG} alt="Mountain" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-[#D95C41]" />
            <span className="font-display text-xl font-bold tracking-tight">THE PEAK FREAKS</span>
          </div>
          <div>
            <p className="pf-label text-white/70 mb-3">Operations Portal</p>
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight max-w-md">
              Run every trek like a well-packed rucksack.
            </h1>
            <p className="mt-4 text-white/80 max-w-md">
              Bookings, rentals, transport, staff and payments — one command center for the mountain.
            </p>
          </div>
          <div className="text-xs text-white/50 pf-tabular">
            © {new Date().getFullYear()} The Peak Freaks · v1.0
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[var(--pf-bg)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Mountain className="h-6 w-6 text-[#D95C41]" />
            <span className="font-display text-lg font-bold">THE PEAK FREAKS</span>
          </div>
          <p className="pf-label mb-2">Sign in</p>
          <h2 className="font-display text-3xl font-bold mb-2">Welcome back, freak.</h2>
          <p className="text-sm text-[var(--pf-muted)] mb-8">
            Use your operations account to enter the portal.
          </p>

          <form onSubmit={submit} className="space-y-5" data-testid="login-form">
            <div>
              <Label className="pf-label" htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  data-testid="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 bg-white"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="pf-label" htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 bg-white"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              data-testid="login-submit-button"
              className="w-full h-11 rounded-full pf-btn-primary hover:bg-[var(--pf-primary-hover)]"
            >
              {busy ? "Signing in…" : "Enter Portal"}
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-4 text-xs text-[var(--pf-muted)]">
            <p className="pf-label mb-2">Test credentials</p>
            <p>Admin — admin@peakfreaks.com / Peak@2026</p>
            <p>Manager — manager@peakfreaks.com / Manager@2026</p>
            <p>Staff — staff@peakfreaks.com / Staff@2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
