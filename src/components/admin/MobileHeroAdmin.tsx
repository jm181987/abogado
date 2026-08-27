import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

export function MobileHeroAdmin({ lang }: { lang: Lang }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const queryClient = useQueryClient();

  async function load() {
    const { data } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
    setUrl(((data?.data as any)?.media?.heroMobileImage) ?? "");
  }

  useEffect(() => { void load(); }, [lang]);

  async function persist(heroMobileImage: string) {
    for (const contentLang of ["es", "pt"] as const) {
      const { data } = await supabase.from("site_content").select("data").eq("lang", contentLang).maybeSingle();
      const current = (data?.data as any) ?? {};
      const { error } = await supabase.from("site_content").upsert({
        lang: contentLang,
        data: { ...current, media: { ...(current.media ?? {}), heroMobileImage } },
        updated_at: new Date().toISOString(),
      }, { onConflict: "lang" });
      if (error) throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `hero-mobile-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("site-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
      const { error: rowError } = await supabase.from("site_photos").insert({
        slot: `hero-mobile-${Date.now()}`,
        storage_path: path,
        alt_es: "Hero móvil",
        alt_pt: "Hero mobile",
      });
      if (rowError) throw rowError;
      await persist(publicUrl);
      setUrl(publicUrl);
      e.target.value = "";
    } catch (error: any) {
      alert(error?.message ?? ui(lang, "No se pudo subir la imagen.", "Não foi possível enviar a imagem."));
    } finally {
      setUploading(false);
    }
  }

  async function clear() {
    if (!confirm(ui(lang, "¿Quitar la imagen específica para móvil?", "Remover a imagem específica para celular?"))) return;
    setRemoving(true);
    try {
      await persist("");
      setUrl("");
    } catch (error: any) {
      alert(error?.message ?? ui(lang, "No se pudo quitar la imagen.", "Não foi possível remover a imagem."));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-primary/[0.035] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{ui(lang, "Hero responsive", "Hero responsivo")}</p>
          <h2 className="mt-1 font-display text-xl">{ui(lang, "Foto del hero para móvil y tablet", "Foto do hero para celular e tablet")}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{ui(lang, "Esta imagen se usa automáticamente en pantallas menores a 1024 px. En escritorio se mantiene la foto de portada normal.", "Esta imagem é usada automaticamente em telas menores que 1024 px. No desktop, a foto de capa normal é mantida.")}</p>
        </div>
        {url && <button type="button" onClick={clear} disabled={removing} className="min-h-10 rounded-xl border border-destructive/30 px-4 text-xs font-bold text-destructive disabled:opacity-50">{removing ? ui(lang, "Quitando…", "Removendo…") : ui(lang, "Quitar hero móvil", "Remover hero mobile")}</button>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)] md:items-center">
        <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-background px-5 py-6 text-center transition hover:border-primary hover:bg-primary/5">
          <span className="text-sm font-bold text-foreground">{uploading ? ui(lang, "Subiendo imagen…", "Enviando imagem…") : ui(lang, "+ Subir foto del hero móvil", "+ Enviar foto do hero mobile")}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP</span>
          <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="sr-only" />
        </label>

        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          {url ? <img src={url} alt={ui(lang, "Vista previa del hero móvil", "Prévia do hero mobile")} className="aspect-[4/5] max-h-72 w-full object-cover object-right" /> : <div className="grid min-h-40 place-items-center px-4 text-center text-xs text-muted-foreground">{ui(lang, "Sin imagen móvil. El sitio usa la portada normal como respaldo.", "Sem imagem mobile. O site usa a capa normal como alternativa.")}</div>}
        </div>
      </div>
    </section>
  );
}
