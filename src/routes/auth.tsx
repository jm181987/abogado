import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Ingresar · Vizcaya Salud" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setSubmitting(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setSubmitting(false);
    if (error) return setErr(error);
    if (mode === "signup") setMsg("Cuenta creada. Revisa tu correo para confirmar (si está habilitado) o inicia sesión.");
    else navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="font-display text-3xl font-semibold">B</span>
          <span className="font-display text-3xl font-light italic text-primary"> SP</span>
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl mb-1">{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</h1>
          <p className="text-sm text-muted-foreground mb-6">Acceso al panel de administración.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Contraseña</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            {msg && <p className="text-sm text-primary">{msg}</p>}
            <button disabled={submitting} type="submit"
              className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-50">
              {submitting ? "..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setMsg(null); }}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
          </button>
        </div>
        <Link to="/" className="block text-center mt-4 text-xs text-muted-foreground hover:text-foreground">← Volver al sitio</Link>
      </div>
    </div>
  );
}
