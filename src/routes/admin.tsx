import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePreferredLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { useSiteContent } from "@/lib/site-content";
import type { Lang } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Asesoría Jurídica" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Plan = { id: string; name_es: string; name_pt: string; age_es: string; age_pt: string; price: string; old_price: string; features_es: string[]; features_pt: string[]; sort_order: number; popular: boolean; active: boolean };
type Photo = { id: string; slot: string; storage_path: string; alt_es: string | null; alt_pt: string | null; updated_at: string };
type AdminTab = "content" | "plans" | "photos";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = usePreferredLanguage();
  const [tab, setTab] = useState<AdminTab>("content");
  const { data: siteContent } = useSiteContent(lang);
  const brand = siteContent?.brand ?? { name1: ui(lang, "Asesoría", "Assessoria"), name2: ui(lang, "Jurídica", "Jurídica"), logoUrl: "" };
  const tabs = [
    { id: "content" as const, label: ui(lang, "Contenido", "Conteúdo"), description: ui(lang, "Textos, marca y datos del sitio", "Textos, marca e dados do site") },
    { id: "plans" as const, label: ui(lang, "Planes", "Planos"), description: ui(lang, "Servicios, precios y orden", "Serviços, preços e ordem") },
    { id: "photos" as const, label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Portada y galería", "Capa e galeria") },
  ];

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{ui(lang, "Cargando…", "Carregando…")}</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <LanguageSelector lang={lang} setLang={setLang} />
        <h1 className="font-display text-2xl">{ui(lang, "Sin acceso", "Sem acesso")}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {ui(lang, `Tu cuenta (${user.email}) no tiene rol de administrador.`, `Sua conta (${user.email}) não possui função de administrador.`)}
        </p>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground underline">{ui(lang, "Cerrar sesión", "Sair")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {brand.logoUrl ? <img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-9 w-auto max-w-48 object-contain" /> : (
              <span className="min-w-0 leading-none"><span className="block truncate font-display text-xl font-semibold">{brand.name1}</span><span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{brand.name2}</span></span>
            )}
            <span className="hidden sm:inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 text-sm">
            <LanguageSelector lang={lang} setLang={setLang} compact />
            <span className="text-muted-foreground hidden lg:inline truncate max-w-56">{user.email}</span>
            <button onClick={signOut} className="min-h-10 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted">{ui(lang, "Salir", "Sair")}</button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6" aria-label={ui(lang, "Secciones del panel", "Seções do painel")}>
          <div className="flex min-w-max gap-2 pb-3">
            {tabs.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`min-h-12 rounded-xl border px-4 py-2 text-left transition ${tab === item.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-muted/50"}`}>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={`mt-0.5 block text-[10px] ${tab === item.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{item.description}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {tab === "content" && <ContentEditor uiLang={lang} />}
        {tab === "plans" && <PlansTab lang={lang} />}
        {tab === "photos" && <PhotosTab lang={lang} />}
      </main>
    </div>
  );
}

function LanguageSelector({ lang, setLang, compact = false }: { lang: Lang; setLang: (lang: Lang) => void; compact?: boolean }) {
  return (
    <div className="flex items-center rounded-full border border-border bg-card p-1 text-xs" aria-label={ui(lang, "Idioma", "Idioma")}>
      {(["es", "pt"] as const).map(value => (
        <button key={value} type="button" onClick={() => setLang(value)} className={`${compact ? "px-2.5" : "px-3"} rounded-full py-1.5 font-bold uppercase transition ${lang === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{value}</button>
      ))}
    </div>
  );
}

function PlansTab({ lang }: { lang: Lang }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("plans").select("*").order("sort_order");
    if (error) alert(ui(lang, "Error cargando planes: ", "Erro ao carregar planos: ") + error.message);
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function refreshSiteContent() { await queryClient.invalidateQueries({ queryKey: ["site_content"] }); }
  async function save(p: Plan) {
    setSaving(p.id);
    const { error } = await supabase.from("plans").update({ name_es: p.name_es, name_pt: p.name_pt, age_es: p.age_es, age_pt: p.age_pt, price: p.price, old_price: p.old_price, features_es: p.features_es, features_pt: p.features_pt, popular: p.popular, sort_order: p.sort_order, active: p.active, updated_at: new Date().toISOString() }).eq("id", p.id);
    setSaving(null);
    if (error) { alert(ui(lang, "Error guardando: ", "Erro ao salvar: ") + error.message); return; }
    await refreshSiteContent();
  }
  function update(id: string, patch: Partial<Plan>) { setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); }
  async function addPlan() {
    const nextOrder = plans.length ? Math.max(...plans.map(p => p.sort_order ?? 0)) + 1 : 1;
    const { error } = await supabase.from("plans").insert({ name_es: "Nuevo plan", name_pt: "Novo plano", age_es: "", age_pt: "", price: "R$ 0", old_price: "", features_es: [], features_pt: [], popular: false, sort_order: nextOrder, active: true } as any);
    if (error) { alert(ui(lang, "Error creando plan: ", "Erro ao criar plano: ") + error.message); return; }
    await load(); await refreshSiteContent();
  }
  async function remove(p: Plan) {
    if (!confirm(ui(lang, `¿Eliminar el plan "${p.name_es}"? Esta acción no se puede deshacer.`, `Excluir o plano "${p.name_pt || p.name_es}"? Esta ação não pode ser desfeita.`))) return;
    const { error } = await supabase.from("plans").delete().eq("id", p.id);
    if (error) { alert(ui(lang, "Error eliminando: ", "Erro ao excluir: ") + error.message); return; }
    await load(); await refreshSiteContent();
  }

  if (loading) return <p className="text-sm text-muted-foreground">{ui(lang, "Cargando…", "Carregando…")}</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl">{ui(lang, "Planes y servicios", "Planos e serviços")}</h2><p className="mt-1 text-xs text-muted-foreground">{plans.length} {ui(lang, "plan(es). Solo los activos aparecen en el sitio.", "plano(s). Apenas os ativos aparecem no site.")}</p></div>
        <button onClick={addPlan} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm">+ {ui(lang, "Nuevo plan", "Novo plano")}</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map(p => (
          <div key={p.id} className={`rounded-2xl border p-5 space-y-4 ${p.active ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-75"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={p.name_es} onChange={e => update(p.id, { name_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre (ES)" />
              <input value={p.name_pt} onChange={e => update(p.id, { name_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nome (PT)" />
              <input value={p.age_es} onChange={e => update(p.id, { age_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción breve (ES)" />
              <input value={p.age_pt} onChange={e => update(p.id, { age_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descrição breve (PT)" />
              <label className="text-xs text-muted-foreground">{ui(lang, "Precio", "Preço")}<input value={p.price} onChange={e => update(p.id, { price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <label className="text-xs text-muted-foreground">{ui(lang, "Precio anterior", "Preço anterior")}<input value={p.old_price ?? ""} onChange={e => update(p.id, { old_price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <label className="text-xs text-muted-foreground">{ui(lang, "Orden", "Ordem")}<input type="number" value={p.sort_order} onChange={e => update(p.id, { sort_order: Number(e.target.value) })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            </div>
            <label className="block text-xs text-muted-foreground">{ui(lang, "Características (ES) — una por línea", "Características (ES) — uma por linha")}<textarea value={(p.features_es ?? []).join("\n")} onChange={e => update(p.id, { features_es: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-muted-foreground">{ui(lang, "Características (PT) — una por línea", "Características (PT) — uma por linha")}<textarea value={(p.features_pt ?? []).join("\n")} onChange={e => update(p.id, { features_pt: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.popular} onChange={e => update(p.id, { popular: e.target.checked })} />{ui(lang, "Más popular", "Mais popular")}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={e => update(p.id, { active: e.target.checked })} />{ui(lang, "Activo", "Ativo")}</label></div>
              <div className="flex gap-2"><button onClick={() => remove(p)} className="min-h-10 rounded-lg border border-destructive/30 px-4 text-xs font-bold text-destructive">{ui(lang, "Eliminar", "Excluir")}</button><button onClick={() => save(p)} disabled={saving === p.id} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving === p.id ? ui(lang, "Guardando…", "Salvando…") : ui(lang, "Guardar", "Salvar")}</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosTab({ lang }: { lang: Lang }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    const [{ data: ph }, { data: content }] = await Promise.all([supabase.from("site_photos").select("*").order("updated_at", { ascending: false }), supabase.from("site_content").select("data").eq("lang", lang).maybeSingle()]);
    setPhotos((ph as Photo[]) ?? []);
    const media = ((content?.data as any)?.media) ?? {};
    setHeroUrl(media.heroImage ?? ""); setGallery(Array.isArray(media.gallery) ? media.gallery : []);
  }
  useEffect(() => { void load(); }, [lang]);
  function urlFor(path: string) { return supabase.storage.from("site-photos").getPublicUrl(path).data.publicUrl; }
  async function persistMedia(next: { heroImage?: string; gallery?: string[] }) {
    for (const contentLang of ["es", "pt"] as const) {
      const { data } = await supabase.from("site_content").select("data").eq("lang", contentLang).maybeSingle();
      const current = (data?.data as any) ?? {};
      const { error } = await supabase.from("site_content").upsert({ lang: contentLang, data: { ...current, media: { ...(current.media ?? {}), ...next } }, updated_at: new Date().toISOString() }, { onConflict: "lang" });
      if (error) throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-photos").upload(path, file);
    if (upErr) { alert(upErr.message); setUploading(false); return; }
    const { error } = await supabase.from("site_photos").insert({ slot: `photo-${Date.now()}`, storage_path: path, alt_es: title || null, alt_pt: title || null });
    setUploading(false); if (error) { alert(error.message); return; } setTitle(""); e.target.value = ""; await load();
  }
  async function remove(p: Photo) {
    if (!confirm(ui(lang, "¿Eliminar foto?", "Excluir foto?"))) return;
    const url = urlFor(p.storage_path); await supabase.storage.from("site-photos").remove([p.storage_path]); await supabase.from("site_photos").delete().eq("id", p.id);
    const nextHero = heroUrl === url ? "" : heroUrl; const nextGallery = gallery.filter(u => u !== url); if (nextHero !== heroUrl || nextGallery.length !== gallery.length) await persistMedia({ heroImage: nextHero, gallery: nextGallery }); await load();
  }
  async function useAsHero(p: Photo) { setSavingKey(`hero-${p.id}`); const url = urlFor(p.storage_path); await persistMedia({ heroImage: url }); setHeroUrl(url); setSavingKey(null); }
  async function toggleGallery(p: Photo) { setSavingKey(`gal-${p.id}`); const url = urlFor(p.storage_path); const next = gallery.includes(url) ? gallery.filter(u => u !== url) : [...gallery, url]; await persistMedia({ gallery: next }); setGallery(next); setSavingKey(null); }
  async function clearHero() { if (!confirm(ui(lang, "¿Volver a la portada por defecto?", "Voltar à capa padrão?"))) return; await persistMedia({ heroImage: "" }); setHeroUrl(""); }

  return (
    <div className="space-y-6">
      <div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card"><input value={title} onChange={e => setTitle(e.target.value)} placeholder={ui(lang, "Título (opcional)", "Título (opcional)")} className="w-full mb-3 rounded-lg border border-input bg-background px-3 py-2 text-sm" /><input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="text-sm" />{uploading && <p className="text-xs text-muted-foreground mt-2">{ui(lang, "Subiendo…", "Enviando…")}</p>}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between mb-2"><p className="text-xs uppercase tracking-wide text-muted-foreground">{ui(lang, "Foto de portada", "Foto de capa")}</p>{heroUrl && <button onClick={clearHero} className="text-xs font-semibold text-destructive">{ui(lang, "Quitar", "Remover")}</button>}</div>{heroUrl ? <img src={heroUrl} alt="Hero" className="w-full aspect-[16/9] object-cover rounded-xl" /> : <p className="text-sm text-muted-foreground py-6 text-center">{ui(lang, "Usando la imagen por defecto.", "Usando a imagem padrão.")}</p>}</div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{ui(lang, "Galería en la web", "Galeria no site")} ({gallery.length})</p>{gallery.length ? <div className="grid grid-cols-4 gap-1.5">{gallery.map((u, i) => <img key={`${u}-${i}`} src={u} alt="" className="aspect-square object-cover rounded" />)}</div> : <p className="text-sm text-muted-foreground py-6 text-center">{ui(lang, "Aún no hay fotos en la galería.", "Ainda não há fotos na galeria.")}</p>}</div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map(p => { const url = urlFor(p.storage_path); const isHero = heroUrl === url; const inGallery = gallery.includes(url); return <div key={p.id} className={`rounded-2xl overflow-hidden border bg-card ${isHero ? "border-primary ring-2 ring-primary/30" : "border-border"}`}><div className="relative"><img src={url} alt={(lang === "pt" ? p.alt_pt : p.alt_es) ?? ""} className="w-full aspect-square object-cover" />{isHero && <span className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5">Hero</span>}{inGallery && <span className="absolute top-2 right-2 rounded-full bg-foreground text-background text-[10px] px-2 py-0.5">{ui(lang, "Galería", "Galeria")}</span>}</div><div className="p-3 space-y-2"><p className="text-xs truncate">{(lang === "pt" ? p.alt_pt : p.alt_es) || p.storage_path}</p><div className="grid gap-2"><button onClick={() => useAsHero(p)} disabled={isHero || savingKey === `hero-${p.id}`} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{isHero ? "✓ Hero" : ui(lang, "Usar como portada", "Usar como capa")}</button><button onClick={() => toggleGallery(p)} disabled={savingKey === `gal-${p.id}`} className={`rounded-lg px-3 py-2 text-xs font-bold ${inGallery ? "bg-foreground text-background" : "border border-border"}`}>{inGallery ? ui(lang, "Quitar de galería", "Remover da galeria") : ui(lang, "+ Galería", "+ Galeria")}</button><button onClick={() => remove(p)} className="min-h-10 rounded-lg border border-destructive/30 px-3 text-xs font-bold text-destructive">{ui(lang, "Eliminar", "Excluir")}</button></div></div></div>; })}
        {!photos.length && <p className="text-sm text-muted-foreground col-span-full">{ui(lang, "Sin fotos aún.", "Ainda sem fotos.")}</p>}
      </div>
    </div>
  );
}
