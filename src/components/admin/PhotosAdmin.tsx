import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dataClient } from "@/lib/data-client";
import type { Lang } from "@/lib/i18n";

type Photo = {
  id: string;
  slot: string;
  storage_path: string;
  alt_es: string | null;
  alt_pt: string | null;
  updated_at: string;
};

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

export function PhotosAdmin({ lang }: { lang: Lang }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    const [{ data: photoRows }, { data: content }] = await Promise.all([
      dataClient.from("site_photos").select("*").order("updated_at", { ascending: false }),
      dataClient.from("site_content").select("data").eq("lang", lang).maybeSingle(),
    ]);
    setPhotos((photoRows as Photo[]) ?? []);
    const media = ((content?.data as any)?.media) ?? {};
    setHeroUrl(media.heroImage ?? "");
    setGallery(Array.isArray(media.gallery) ? media.gallery : []);
  }

  useEffect(() => { void load(); }, [lang]);

  function urlFor(path: string) {
    return dataClient.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
  }

  async function persistMedia(next: { heroImage?: string; gallery?: string[] }) {
    for (const contentLang of ["es", "pt"] as const) {
      const { data } = await dataClient.from("site_content").select("data").eq("lang", contentLang).maybeSingle();
      const current = (data?.data as any) ?? {};
      const { error } = await dataClient.from("site_content").upsert({
        lang: contentLang,
        data: { ...current, media: { ...(current.media ?? {}), ...next } },
        updated_at: new Date().toISOString(),
      }, { onConflict: "lang" });
      if (error) throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: uploadError } = await dataClient.storage.from("site-photos").upload(path, file);
    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }
    const { error } = await dataClient.from("site_photos").insert({
      slot: `photo-${Date.now()}`,
      storage_path: path,
      alt_es: title || null,
      alt_pt: title || null,
    });
    setUploading(false);
    if (error) {
      alert(error.message);
      return;
    }
    setTitle("");
    event.target.value = "";
    await load();
  }

  async function remove(photo: Photo) {
    if (!confirm(ui(lang, "¿Eliminar foto?", "Excluir foto?"))) return;
    const url = urlFor(photo.storage_path);
    await dataClient.storage.from("site-photos").remove([photo.storage_path]);
    await dataClient.from("site_photos").delete().eq("id", photo.id);
    const nextHero = heroUrl === url ? "" : heroUrl;
    const nextGallery = gallery.filter(item => item !== url);
    if (nextHero !== heroUrl || nextGallery.length !== gallery.length) {
      await persistMedia({ heroImage: nextHero, gallery: nextGallery });
    }
    await load();
  }

  async function useAsHero(photo: Photo) {
    setSavingKey(`hero-${photo.id}`);
    const url = urlFor(photo.storage_path);
    await persistMedia({ heroImage: url });
    setHeroUrl(url);
    setSavingKey(null);
  }

  async function toggleGallery(photo: Photo) {
    setSavingKey(`gal-${photo.id}`);
    const url = urlFor(photo.storage_path);
    const next = gallery.includes(url) ? gallery.filter(item => item !== url) : [...gallery, url];
    await persistMedia({ gallery: next });
    setGallery(next);
    setSavingKey(null);
  }

  async function clearHero() {
    if (!confirm(ui(lang, "¿Volver a la portada por defecto?", "Voltar à capa padrão?"))) return;
    await persistMedia({ heroImage: "" });
    setHeroUrl("");
  }

  return (
    <div className="space-y-6">
      <div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={ui(lang, "Título (opcional)", "Título (opcional)")} className="w-full mb-3 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="text-sm" />
        {uploading && <p className="text-xs text-muted-foreground mt-2">{ui(lang, "Subiendo…", "Enviando…")}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{ui(lang, "Foto de portada", "Foto de capa")}</p>
            {heroUrl && <button onClick={clearHero} className="text-xs font-semibold text-destructive">{ui(lang, "Quitar", "Remover")}</button>}
          </div>
          {heroUrl ? <img src={heroUrl} alt="Hero" className="w-full aspect-[16/9] object-cover rounded-xl" /> : <p className="text-sm text-muted-foreground py-6 text-center">{ui(lang, "Usando la imagen por defecto.", "Usando a imagem padrão.")}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{ui(lang, "Galería en la web", "Galeria no site")} ({gallery.length})</p>
          {gallery.length ? <div className="grid grid-cols-4 gap-1.5">{gallery.map((url, index) => <img key={`${url}-${index}`} src={url} alt="" className="aspect-square object-cover rounded" />)}</div> : <p className="text-sm text-muted-foreground py-6 text-center">{ui(lang, "Aún no hay fotos en la galería.", "Ainda não há fotos na galeria.")}</p>}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map(photo => {
          const url = urlFor(photo.storage_path);
          const isHero = heroUrl === url;
          const inGallery = gallery.includes(url);
          return (
            <div key={photo.id} className={`rounded-2xl overflow-hidden border bg-card ${isHero ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
              <div className="relative">
                <img src={url} alt={(lang === "pt" ? photo.alt_pt : photo.alt_es) ?? ""} className="w-full aspect-square object-cover" />
                {isHero && <span className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5">Hero</span>}
                {inGallery && <span className="absolute top-2 right-2 rounded-full bg-foreground text-background text-[10px] px-2 py-0.5">{ui(lang, "Galería", "Galeria")}</span>}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs truncate">{(lang === "pt" ? photo.alt_pt : photo.alt_es) || photo.storage_path}</p>
                <div className="grid gap-2">
                  <button onClick={() => useAsHero(photo)} disabled={isHero || savingKey === `hero-${photo.id}`} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{isHero ? "✓ Hero" : ui(lang, "Usar como portada", "Usar como capa")}</button>
                  <button onClick={() => toggleGallery(photo)} disabled={savingKey === `gal-${photo.id}`} className={`rounded-lg px-3 py-2 text-xs font-bold ${inGallery ? "bg-foreground text-background" : "border border-border"}`}>{inGallery ? ui(lang, "Quitar de galería", "Remover da galeria") : ui(lang, "+ Galería", "+ Galeria")}</button>
                  <button onClick={() => remove(photo)} className="min-h-10 rounded-lg border border-destructive/30 px-3 text-xs font-bold text-destructive">{ui(lang, "Eliminar", "Excluir")}</button>
                </div>
              </div>
            </div>
          );
        })}
        {!photos.length && <p className="text-sm text-muted-foreground col-span-full">{ui(lang, "Sin fotos aún.", "Ainda sem fotos.")}</p>}
      </div>
    </div>
  );
}
