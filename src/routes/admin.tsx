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

type Plan = { id: string; name: string; age_range: string; price: string; old_price: string; features: string[]; position: number; popular: boolean };
type Appointment = { id: string; created_at: string; name: string; email: string; phone: string; plan_id: string | null; message: string | null; status: string };
type Photo = { id: string; storage_path: string; title: string | null; created_at: string };

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"appointments" | "plans" | "photos">("appointments");

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
          {(["appointments", "plans", "photos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm border-b-2 transition ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "appointments" ? "Citas" : t === "plans" ? "Planes" : "Fotos"}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "photos" && <PhotosTab />}
      </main>
    </div>
  );
}

function AppointmentsTab() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
    setItems((data as Appointment[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando citas…</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground">No hay citas todavía.</p>;

  return (
    <div className="space-y-3">
      {items.map(a => (
        <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("es-CL")}</p>
              <p className="text-sm mt-2">📧 {a.email} · 📱 {a.phone}</p>
              {a.message && <p className="text-sm text-muted-foreground mt-2 italic">"{a.message}"</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}
                className="text-xs rounded-full border border-border px-3 py-1 bg-background">
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
              <button onClick={() => remove(a.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
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
