import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Asesoría Jurídica" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Plan = {
  id: string;
  name_es: string;
  name_pt: string;
  age_es: string;
  age_pt: string;
  price: string;
  old_price: string;
  features_es: string[];
  features_pt: string[];
  sort_order: number;
  popular: boolean;
  active: boolean;
};

type Photo = {
  id: string;
  slot: string;
  storage_path: string;
  alt_es: string | null;
  alt_pt: string | null;
  updated_at: string;
};

type AdminTab = "content" | "plans" | "photos";

const ADMIN_TABS: Array<{ id: AdminTab; label: string; description: string }> = [
  { id: "content", label: "Contenido", description: "Textos, marca y datos del sitio" },
  { id: "plans", label: "Planes", description: "Servicios, precios y orden" },
  { id: "photos", label: "Fotos", description: "Portada y galería" },
];

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("content");
  const { data: siteContent } = useSiteContent("es");
  const brand = siteContent?.brand ?? { name1: "Asesoría", name2: "Jurídica", logoUrl: "" };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>;
  }
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
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-9 w-auto max-w-48 object-contain" />
            ) : (
              <span className="min-w-0 leading-none">
                <span className="block truncate font-display text-xl font-semibold">{brand.name1}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{brand.name2}</span>
              </span>
            )}
            <span className="hidden sm:inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden md:inline truncate max-w-56">{user.email}</span>
            <button onClick={signOut} className="min-h-10 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted">Salir</button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6" aria-label="Secciones del panel">
          <div className="flex min-w-max gap-2 pb-3">
            {ADMIN_TABS.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`min-h-12 rounded-xl border px-4 py-2 text-left transition ${
                  tab === item.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-muted/50"
                }`}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={`mt-0.5 block text-[10px] ${tab === item.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{item.description}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {tab === "content" && <ContentEditor />}
        {tab === "plans" && <PlansTab />}
        {tab === "photos" && <PhotosTab />}
      </main>
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("plans").select("*").order("sort_order");
    if (error) {
      console.error(error);
      alert("Error cargando planes: " + error.message);
    }
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function refreshSiteContent() {
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function save(p: Plan) {
    setSaving(p.id);
    const { error } = await supabase.from("plans").update({
      name_es: p.name_es,
      name_pt: p.name_pt,
      age_es: p.age_es,
      age_pt: p.age_pt,
      price: p.price,
      old_price: p.old_price,
      features_es: p.features_es,
      features_pt: p.features_pt,
      popular: p.popular,
      sort_order: p.sort_order,
      active: p.active,
      updated_at: new Date().toISOString(),
    }).eq("id", p.id);
    setSaving(null);
    if (error) {
      alert("Error guardando: " + error.message);
      return;
    }
    await refreshSiteContent();
  }

  function update(id: string, patch: Partial<Plan>) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function addPlan() {
    const nextOrder = plans.length ? Math.max(...plans.map(p => p.sort_order ?? 0)) + 1 : 1;
    const payload = {
      name_es: "Nuevo plan",
      name_pt: "Novo plano",
      age_es: "",
      age_pt: "",
      price: "R$ 0",
      old_price: "",
      features_es: [] as string[],
      features_pt: [] as string[],
      popular: false,
      sort_order: nextOrder,
      active: true,
    };
    const { error } = await supabase.from("plans").insert(payload as any);
    if (error) {
      alert("Error creando plan: " + error.message);
      return;
    }
    await load();
    await refreshSiteContent();
  }

  async function remove(p: Plan) {
    if (!confirm(`¿Eliminar el plan "${p.name_es}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("plans").delete().eq("id", p.id);
    if (error) {
      alert("Error eliminando: " + error.message);
      return;
    }
    await load();
    await refreshSiteContent();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Planes y servicios</h2>
          <p className="mt-1 text-xs text-muted-foreground">{plans.length} plan(es). Solo los marcados como activos aparecen en el homepage.</p>
        </div>
        <button onClick={addPlan} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">+ Nuevo plan</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map(p => (
          <div key={p.id} className={`rounded-2xl border p-5 space-y-4 ${p.active ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-75"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={p.name_es} onChange={e => update(p.id, { name_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre (ES)" />
              <input value={p.name_pt} onChange={e => update(p.id, { name_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nome (PT)" />
              <input value={p.age_es} onChange={e => update(p.id, { age_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción breve (ES)" />
              <input value={p.age_pt} onChange={e => update(p.id, { age_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descrição breve (PT)" />
              <label className="block text-xs font-medium text-muted-foreground">Precio
                <input value={p.price} onChange={e => update(p.id, { price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="R$ 180,00" />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">Precio anterior
                <input value={p.old_price ?? ""} onChange={e => update(p.id, { old_price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">Orden
                <input type="number" value={p.sort_order} onChange={e => update(p.id, { sort_order: Number(e.target.value) })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </label>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">Características (ES) — una por línea
              <textarea value={(p.features_es ?? []).join("\n")} onChange={e => update(p.id, { features_es: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Características (PT) — uma por linha
              <textarea value={(p.features_pt ?? []).join("\n")} onChange={e => update(p.id, { features_pt: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.popular} onChange={e => update(p.id, { popular: e.target.checked })} /> Más popular</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={e => update(p.id, { active: e.target.checked })} /> Activo</label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => remove(p)} className="min-h-10 rounded-lg border border-destructive/30 px-4 text-xs font-bold text-destructive hover:bg-destructive/5">Eliminar</button>
                <button onClick={() => save(p)} disabled={saving === p.id} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving === p.id ? "Guardando…" : "Guardar"}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [heroUrl, setHeroUrl] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    const [{ data: ph }, { data: content }] = await Promise.all([
      supabase.from("site_photos").select("*").order("updated_at", { ascending: false }),
      supabase.from("site_content").select("data").eq("lang", "es").maybeSingle(),
    ]);
    setPhotos((ph as Photo[]) ?? []);
    const media = ((content?.data as any)?.media) ?? {};
    setHeroUrl(media.heroImage ?? "");
    setGallery(Array.isArray(media.gallery) ? media.gallery : []);
  }

  useEffect(() => { void load(); }, []);

  function urlFor(path: string) {
    return supabase.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
  }

  async function persistMedia(next: { heroImage?: string; gallery?: string[] }) {
    for (const lang of ["es", "pt"] as const) {
      const { data } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
      const current = (data?.data as any) ?? {};
      const merged = { ...current, media: { ...(current.media ?? {}), ...next } };
      const { error } = await supabase.from("site_content").upsert(
        { lang, data: merged, updated_at: new Date().toISOString() },
        { onConflict: "lang" },
      );
      if (error) {
        alert("Error al guardar media (" + lang + "): " + error.message);
        throw error;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("site-photos").upload(path, file);
    if (upErr) {
      alert(upErr.message);
      setUploading(false);
      return;
    }
    const { error: insErr } = await supabase.from("site_photos").insert({
      slot: `photo-${Date.now()}`,
      storage_path: path,
      alt_es: title || null,
      alt_pt: title || null,
    });
    if (insErr) {
      alert("Error al guardar: " + insErr.message);
      setUploading(false);
      return;
    }
    setTitle("");
    setUploading(false);
    e.target.value = "";
    await load();
  }

  async function remove(p: Photo) {
    if (!confirm("¿Eliminar foto?")) return;
    const url = urlFor(p.storage_path);
    await supabase.storage.from("site-photos").remove([p.storage_path]);
    await supabase.from("site_photos").delete().eq("id", p.id);
    const nextHero = heroUrl === url ? "" : heroUrl;
    const nextGallery = gallery.filter(u => u !== url);
    if (nextHero !== heroUrl || nextGallery.length !== gallery.length) {
      await persistMedia({ heroImage: nextHero, gallery: nextGallery });
    }
    await load();
  }

  async function useAsHero(p: Photo) {
    setSavingKey(`hero-${p.id}`);
    const url = urlFor(p.storage_path);
    await persistMedia({ heroImage: url });
    setHeroUrl(url);
    setSavingKey(null);
  }

  async function toggleGallery(p: Photo) {
    setSavingKey(`gal-${p.id}`);
    const url = urlFor(p.storage_path);
    const next = gallery.includes(url) ? gallery.filter(u => u !== url) : [...gallery, url];
    await persistMedia({ gallery: next });
    setGallery(next);
    setSavingKey(null);
  }

  async function clearHero() {
    if (!confirm("¿Volver al hero por defecto?")) return;
    await persistMedia({ heroImage: "" });
    setHeroUrl("");
  }

  return (
    <div className="space-y-6">
      <div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)" className="w-full mb-3 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="text-sm" />
        {uploading && <p className="text-xs text-muted-foreground mt-2">Subiendo…</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Foto de portada (hero)</p>
            {heroUrl && <button onClick={clearHero} className="text-xs font-semibold text-destructive hover:underline">Quitar</button>}
          </div>
          {heroUrl ? <img src={heroUrl} alt="Hero" className="w-full aspect-[16/9] object-cover rounded-xl" /> : <p className="text-sm text-muted-foreground py-6 text-center">Usando la imagen por defecto.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Galería en la web ({gallery.length})</p>
          {gallery.length ? (
            <div className="grid grid-cols-4 gap-1.5">
              {gallery.map((u, i) => <img key={`${u}-${i}`} src={u} alt="" className="aspect-square object-cover rounded" />)}
            </div>
          ) : <p className="text-sm text-muted-foreground py-6 text-center">Aún no hay fotos en la galería.</p>}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map(p => {
          const url = urlFor(p.storage_path);
          const isHero = heroUrl === url;
          const inGallery = gallery.includes(url);
          return (
            <div key={p.id} className={`rounded-2xl overflow-hidden border bg-card ${isHero ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
              <div className="relative">
                <img src={url} alt={p.alt_es ?? ""} className="w-full aspect-square object-cover" />
                {isHero && <span className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5">Hero</span>}
                {inGallery && <span className="absolute top-2 right-2 rounded-full bg-foreground text-background text-[10px] px-2 py-0.5">Galería</span>}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs truncate">{p.alt_es || p.storage_path}</p>
                <div className="grid gap-2">
                  <button onClick={() => useAsHero(p)} disabled={isHero || savingKey === `hero-${p.id}`} className="admin-photo-action admin-photo-action--hero rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{isHero ? "✓ Hero" : "Usar como hero"}</button>
                  <button onClick={() => toggleGallery(p)} disabled={savingKey === `gal-${p.id}`} className={`admin-photo-action ${inGallery ? "admin-photo-action--gallery-active bg-foreground text-background" : "admin-photo-action--gallery border border-border"} rounded-lg px-3 py-2 text-xs font-bold`}>{inGallery ? "Quitar galería" : "+ Galería"}</button>
                  <button onClick={() => remove(p)} className="admin-photo-action admin-photo-action--danger min-h-10 rounded-lg border border-destructive/30 px-3 text-xs font-bold text-destructive">Eliminar</button>
                </div>
              </div>
            </div>
          );
        })}
        {!photos.length && <p className="text-sm text-muted-foreground col-span-full">Sin fotos aún.</p>}
      </div>
    </div>
  );
}
