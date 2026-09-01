import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function MobileHeroAdmin({ lang }: { lang: Lang }) {
  const [url, setUrl] = useState("");
  const [desktopUrl, setDesktopUrl] = useState("");
  const [desktopX, setDesktopX] = useState(50);
  const [desktopY, setDesktopY] = useState(50);
  const [mobileX, setMobileX] = useState(50);
  const [mobileY, setMobileY] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [savedPosition, setSavedPosition] = useState(false);
  const queryClient = useQueryClient();

  async function load() {
    const { data } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
    const media = ((data?.data as any)?.media) ?? {};
    setUrl(media.heroMobileImage ?? "");
    setDesktopUrl(media.heroImage ?? "");
    setDesktopX(Number.isFinite(Number(media.heroPositionX)) ? clamp(Number(media.heroPositionX)) : 50);
    setDesktopY(Number.isFinite(Number(media.heroPositionY)) ? clamp(Number(media.heroPositionY)) : 50);
    setMobileX(Number.isFinite(Number(media.heroMobilePositionX)) ? clamp(Number(media.heroMobilePositionX)) : 50);
    setMobileY(Number.isFinite(Number(media.heroMobilePositionY)) ? clamp(Number(media.heroMobilePositionY)) : 50);
  }

  useEffect(() => { void load(); }, [lang]);

  async function persistMedia(patch: Record<string, unknown>) {
    for (const contentLang of ["es", "pt"] as const) {
      const { data } = await supabase.from("site_content").select("data").eq("lang", contentLang).maybeSingle();
      const current = (data?.data as any) ?? {};
      const { error } = await supabase.from("site_content").upsert({
        lang: contentLang,
        data: { ...current, media: { ...(current.media ?? {}), ...patch } },
        updated_at: new Date().toISOString(),
      }, { onConflict: "lang" });
      if (error) throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function persist(heroMobileImage: string) {
    await persistMedia({ heroMobileImage });
  }

  async function savePosition() {
    setSavingPosition(true);
    setSavedPosition(false);
    try {
      await persistMedia({
        heroPositionX: desktopX,
        heroPositionY: desktopY,
        heroMobilePositionX: mobileX,
        heroMobilePositionY: mobileY,
      });
      setSavedPosition(true);
      window.setTimeout(() => setSavedPosition(false), 2200);
    } catch (error: any) {
      alert(error?.message ?? ui(lang, "No se pudo guardar la posición.", "Não foi possível salvar a posição."));
    } finally {
      setSavingPosition(false);
    }
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

  const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-foreground">
        <span>{label}</span><span className="tabular-nums text-muted-foreground">{value}%</span>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="mt-2 w-full accent-primary"
      />
    </label>
  );

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-primary/[0.035] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{ui(lang, "Hero responsive", "Hero responsivo")}</p>
          <h2 className="mt-1 font-display text-xl">{ui(lang, "Foto y posición del hero", "Foto e posição do hero")}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{ui(lang, "Ajusta dónde queda el foco de la foto en escritorio y en móvil. Mueve los controles horizontal y vertical hasta dejar rostros y elementos importantes exactamente donde quieras.", "Ajuste onde fica o foco da foto no desktop e no celular. Mova os controles horizontal e vertical até deixar rostos e elementos importantes exatamente onde desejar.")}</p>
        </div>
        {url && <button type="button" onClick={clear} disabled={removing} className="min-h-10 rounded-xl border border-destructive/30 px-4 text-xs font-bold text-destructive disabled:opacity-50">{removing ? ui(lang, "Quitando…", "Removendo…") : ui(lang, "Quitar hero móvil", "Remover hero mobile")}</button>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)] md:items-center">
        <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-background px-5 py-6 text-center transition hover:border-primary hover:bg-primary/5">
          <span className="text-sm font-bold text-foreground">{uploading ? ui(lang, "Subiendo imagen…", "Enviando imagem…") : ui(lang, "+ Subir foto específica para móvil", "+ Enviar foto específica para celular")}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP</span>
          <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="sr-only" />
        </label>

        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          {url ? <img src={url} alt={ui(lang, "Vista previa del hero móvil", "Prévia do hero mobile")} className="aspect-[4/5] max-h-72 w-full object-cover" style={{ objectPosition: `${mobileX}% ${mobileY}%` }} /> : <div className="grid min-h-40 place-items-center px-4 text-center text-xs text-muted-foreground">{ui(lang, "Sin imagen móvil. El sitio usa la portada normal como respaldo.", "Sem imagem mobile. O site usa a capa normal como alternativa.")}</div>}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{ui(lang, "Posición en escritorio", "Posição no desktop")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{ui(lang, "Controla la foto principal en pantallas grandes.", "Controla a foto principal em telas grandes.")}</p>
            </div>
            <button type="button" onClick={() => { setDesktopX(50); setDesktopY(50); }} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">{ui(lang, "Centrar", "Centralizar")}</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
            {desktopUrl ? <img src={desktopUrl} alt="Hero desktop" className="aspect-[16/7] w-full object-cover" style={{ objectPosition: `${desktopX}% ${desktopY}%` }} /> : <div className="grid aspect-[16/7] place-items-center px-4 text-center text-xs text-muted-foreground">{ui(lang, "La vista previa aparecerá cuando haya una foto principal configurada.", "A prévia aparecerá quando houver uma foto principal configurada.")}</div>}
          </div>
          <div className="mt-4 grid gap-4">
            <Slider label={ui(lang, "Horizontal · izquierda ↔ derecha", "Horizontal · esquerda ↔ direita")} value={desktopX} onChange={setDesktopX} />
            <Slider label={ui(lang, "Vertical · arriba ↕ abajo", "Vertical · cima ↕ baixo")} value={desktopY} onChange={setDesktopY} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{ui(lang, "Posición en móvil y tablet", "Posição no celular e tablet")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{ui(lang, "Se guarda por separado para que el recorte móvil quede perfecto.", "É salva separadamente para que o recorte mobile fique perfeito.")}</p>
            </div>
            <button type="button" onClick={() => { setMobileX(50); setMobileY(50); }} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">{ui(lang, "Centrar", "Centralizar")}</button>
          </div>
          <div className="mx-auto max-w-[220px] overflow-hidden rounded-xl border border-border bg-muted/30">
            {(url || desktopUrl) ? <img src={url || desktopUrl} alt="Hero mobile" className="aspect-[4/5] w-full object-cover" style={{ objectPosition: `${mobileX}% ${mobileY}%` }} /> : <div className="grid aspect-[4/5] place-items-center px-4 text-center text-xs text-muted-foreground">{ui(lang, "Sin foto para previsualizar.", "Sem foto para visualizar.")}</div>}
          </div>
          <div className="mt-4 grid gap-4">
            <Slider label={ui(lang, "Horizontal · izquierda ↔ derecha", "Horizontal · esquerda ↔ direita")} value={mobileX} onChange={setMobileX} />
            <Slider label={ui(lang, "Vertical · arriba ↕ abajo", "Vertical · cima ↕ baixo")} value={mobileY} onChange={setMobileY} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={savePosition} disabled={savingPosition} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {savingPosition ? ui(lang, "Guardando posición…", "Salvando posição…") : ui(lang, "Guardar posición del hero", "Salvar posição do hero")}
        </button>
        {savedPosition && <span className="text-xs font-semibold text-primary">{ui(lang, "✓ Posición guardada", "✓ Posição salva")}</span>}
      </div>
    </section>
  );
}
