import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Vizcaya Salud" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Plan = { id: string; name_es: string; name_pt: string; age_es: string; age_pt: string; price: string; old_price: string; features_es: string[]; features_pt: string[]; sort_order: number; popular: boolean; active: boolean };
type Appointment = { id: string; created_at: string; name: string; email: string; phone: string; plan_id: string | null; message: string | null; status: string; scheduled_at: string | null; duration_minutes: number | null; admin_notes: string | null; preferred_date: string | null };
type PlanOpt = { id: string; name: string };
type Photo = { id: string; storage_path: string; title: string | null; created_at: string };

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"appointments" | "content" | "plans" | "photos">("appointments");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="font-display text-2xl">Sin acceso</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Tu cuenta ({user.email}) no tiene rol de admin. Ejecuta en Supabase:
        </p>
        <pre className="text-xs bg-muted p-3 rounded-lg max-w-md overflow-x-auto">
{`INSERT INTO user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
        </pre>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground underline">Cerrar sesión</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold">Vizcaya</span>
            <span className="font-display text-xl italic text-primary">Salud</span>
            <span className="ml-3 text-xs uppercase tracking-widest text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:inline">{user.email}</span>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Salir</button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-6 flex gap-1 border-t border-border">
          {(["appointments", "content", "plans", "photos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm border-b-2 transition ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "appointments" ? "Citas" : t === "content" ? "Contenido" : t === "plans" ? "Planes" : "Fotos"}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "content" && <ContentEditor />}
        {tab === "plans" && <PlansTab />}
        {tab === "photos" && <PhotosTab />}
      </main>
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada" };
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  completed: "bg-blue-100 text-blue-900",
  cancelled: "bg-red-100 text-red-900",
};

function AppointmentsTab() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "today" | "past" | "all">("upcoming");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: appts }, { data: pl }] = await Promise.all([
      supabase.from("appointments").select("*").order("scheduled_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }),
      supabase.from("plans").select("id, name").order("position"),
    ]);
    setItems((appts as Appointment[]) ?? []);
    setPlans((pl as PlanOpt[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, changes: Partial<Appointment>) {
    await supabase.from("appointments").update(changes as any).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    load();
  }

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday); endOfToday.setDate(endOfToday.getDate() + 1);

  const filtered = items.filter(a => {
    if (filter === "all") return true;
    const t = a.scheduled_at ? new Date(a.scheduled_at) : null;
    if (filter === "upcoming") return !t || t >= now;
    if (filter === "today") return t && t >= startOfToday && t < endOfToday;
    if (filter === "past") return t && t < now;
    return true;
  });

  const planName = (id: string | null) => plans.find(p => p.id === id)?.name;

  if (loading) return <p className="text-sm text-muted-foreground">Cargando citas…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-border bg-background p-0.5 text-xs">
          {(["upcoming", "today", "past", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 transition ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {f === "upcoming" ? "Próximas" : f === "today" ? "Hoy" : f === "past" ? "Pasadas" : "Todas"}
            </button>
          ))}
        </div>
        <button onClick={() => setCreating(true)}
          className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium">
          + Nueva cita
        </button>
      </div>

      {creating && (
        <NewAppointment plans={plans} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />
      )}

      {!filtered.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sin citas en este filtro.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOpen = expanded === a.id;
            const when = a.scheduled_at ? new Date(a.scheduled_at) : null;
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_COLOR[a.status] ?? "bg-muted"}`}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                      {when && (
                        <span className="text-sm font-medium">
                          📅 {when.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                          {a.duration_minutes ? ` · ${a.duration_minutes}min` : ""}
                        </span>
                      )}
                      {!when && <span className="text-xs text-muted-foreground italic">Sin fecha asignada</span>}
                    </div>
                    <p className="font-medium mt-2">{a.name}</p>
                    <p className="text-sm text-muted-foreground">📧 {a.email} · 📱 {a.phone}</p>
                    {planName(a.plan_id) && <p className="text-xs text-primary mt-1">Plan: {planName(a.plan_id)}</p>}
                    {a.preferred_date && <p className="text-xs text-muted-foreground mt-1">Preferencia paciente: {a.preferred_date}</p>}
                    {a.message && <p className="text-sm text-muted-foreground mt-2 italic">"{a.message}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select value={a.status} onChange={(e) => patch(a.id, { status: e.target.value })}
                      className="text-xs rounded-full border border-border px-3 py-1 bg-background">
                      {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Duración:
                      <select
                        value={a.duration_minutes ?? 60}
                        onChange={(e) => patch(a.id, { duration_minutes: Number(e.target.value) })}
                        className="rounded-full border border-border px-2 py-1 bg-background text-foreground"
                      >
                        {[15, 30, 45, 60, 75, 90, 120].map(m => (
                          <option key={m} value={m}>{m} min</option>
                        ))}
                      </select>
                    </label>
                    <button onClick={() => setExpanded(isOpen ? null : a.id)}
                      className="text-xs text-primary hover:underline">
                      {isOpen ? "Cerrar" : "Editar agenda"}
                    </button>
                    <button onClick={() => remove(a.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border bg-muted/30 p-5 grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="block text-xs font-medium mb-1 text-muted-foreground">Fecha y hora</span>
                      <input type="datetime-local" defaultValue={toLocalInput(a.scheduled_at)}
                        onBlur={e => patch(a.id, { scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-medium mb-1 text-muted-foreground">Duración (min)</span>
                      <input type="number" min={15} step={15} defaultValue={a.duration_minutes ?? 60}
                        onBlur={e => patch(a.id, { duration_minutes: Number(e.target.value) || 60 })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-medium mb-1 text-muted-foreground">Plan</span>
                      <select defaultValue={a.plan_id ?? ""} onBlur={e => patch(a.id, { plan_id: e.target.value || null })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="">—</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className="block md:col-span-3">
                      <span className="block text-xs font-medium mb-1 text-muted-foreground">Notas internas</span>
                      <textarea rows={2} defaultValue={a.admin_notes ?? ""}
                        onBlur={e => patch(a.id, { admin_notes: e.target.value || null })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <p className="md:col-span-3 text-xs text-muted-foreground">Los cambios se guardan al salir del campo.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewAppointment({ plans, onClose, onSaved }: { plans: PlanOpt[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan_id: "", scheduled_at: "", duration_minutes: 60, admin_notes: "", status: "confirmed" });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      ...form,
      full_name: form.name,
      plan_id: form.plan_id || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      duration_minutes: Number(form.duration_minutes) || 60,
      admin_notes: form.admin_notes || null,
    };
    const { error } = await supabase.from("appointments").insert(payload as any);
    setSaving(false);
    if (error) { alert(error.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary/40 bg-primary/5 p-5 grid gap-3 md:grid-cols-2">
      <h3 className="md:col-span-2 font-display text-lg">Nueva cita</h3>
      <input required placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      <input required placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm md:col-span-2" />
      <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      <input type="number" min={15} step={15} placeholder="Duración" value={form.duration_minutes}
        onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
        <option value="">Sin plan</option>
        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
        {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <textarea rows={2} placeholder="Notas internas" value={form.admin_notes} onChange={e => setForm({ ...form, admin_notes: e.target.value })}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm md:col-span-2" />
      <div className="md:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs px-4 py-2 text-muted-foreground hover:text-foreground">Cancelar</button>
        <button disabled={saving} type="submit" className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium disabled:opacity-50">
          {saving ? "Guardando…" : "Crear cita"}
        </button>
      </div>
    </form>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("plans").select("*").order("position");
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(p: Plan) {
    setSaving(p.id);
    await supabase.from("plans").update({
      name: p.name, age_range: p.age_range, price: p.price, old_price: p.old_price,
      features: p.features, popular: p.popular, position: p.position,
    }).eq("id", p.id);
    setSaving(null);
  }

  function update(id: string, patch: Partial<Plan>) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map(p => (
        <div key={p.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={p.name} onChange={e => update(p.id, { name: e.target.value })}
              className="rounded-lg border border-input px-3 py-2 text-sm" placeholder="Nombre" />
            <input value={p.age_range} onChange={e => update(p.id, { age_range: e.target.value })}
              className="rounded-lg border border-input px-3 py-2 text-sm" placeholder="Rango edad" />
            <input value={p.price} onChange={e => update(p.id, { price: e.target.value })}
              className="rounded-lg border border-input px-3 py-2 text-sm" placeholder="Precio" />
            <input value={p.old_price} onChange={e => update(p.id, { old_price: e.target.value })}
              className="rounded-lg border border-input px-3 py-2 text-sm" placeholder="Precio anterior" />
          </div>
          <textarea value={p.features.join("\n")} onChange={e => update(p.id, { features: e.target.value.split("\n").filter(Boolean) })}
            rows={5} className="w-full rounded-lg border border-input px-3 py-2 text-sm font-mono" placeholder="Una feature por línea" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={p.popular} onChange={e => update(p.id, { popular: e.target.checked })} />
              Más popular
            </label>
            <button onClick={() => save(p)} disabled={saving === p.id}
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium disabled:opacity-50">
              {saving === p.id ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");

  async function load() {
    const { data } = await supabase.from("site_photos").select("*").order("created_at", { ascending: false });
    setPhotos((data as Photo[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-photos").upload(path, file);
    if (upErr) { alert(upErr.message); setUploading(false); return; }
    await supabase.from("site_photos").insert({ storage_path: path, title: title || null });
    setTitle(""); setUploading(false);
    e.target.value = "";
    load();
  }

  async function remove(p: Photo) {
    if (!confirm("¿Eliminar foto?")) return;
    await supabase.storage.from("site-photos").remove([p.storage_path]);
    await supabase.from("site_photos").delete().eq("id", p.id);
    load();
  }

  function urlFor(path: string) {
    return supabase.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-border p-6 bg-card">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)"
          className="w-full mb-3 rounded-lg border border-input px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="text-sm" />
        {uploading && <p className="text-xs text-muted-foreground mt-2">Subiendo…</p>}
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map(p => (
          <div key={p.id} className="rounded-2xl overflow-hidden border border-border bg-card group relative">
            <img src={urlFor(p.storage_path)} alt={p.title ?? ""} className="w-full aspect-square object-cover" />
            <div className="p-3">
              <p className="text-xs truncate">{p.title || p.storage_path}</p>
              <button onClick={() => remove(p)} className="text-xs text-destructive hover:underline mt-1">Eliminar</button>
            </div>
          </div>
        ))}
        {!photos.length && <p className="text-sm text-muted-foreground col-span-full">Sin fotos aún.</p>}
      </div>
    </div>
  );
}
