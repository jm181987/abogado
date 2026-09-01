import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

type HeroKind = "desktop" | "mobile";

export function MobileHeroAdmin({ lang }: { lang: Lang }) {
  const [desktopUrl, setDesktopUrl] = useState("");
  const [mobileUrl, setMobileUrl] = useState("");
  const [desktopX, setDesktopX] = useState(50);
  const [desktopY, setDesktopY] = useState(50);
  const [mobileX, setMobileX] = useState(50);
  const [mobileY, setMobileY] = useState(50);
  const [uploading, setUploading] = useState<HeroKind | null>(null);
  const [removing, setRemoving] = useState<HeroKind | null>(null);
  const [savingPosition, setSavingPosition] = useState(false);
  const [savedPosition, setSavedPosition] = useState(false);
  const queryClient = useQueryClient();

  async function load() {
    const { data } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
    const media = ((data?.data as any)?.media) ?? {};
    setDesktopUrl(media.heroImage ?? "");
    setMobileUrl(media.heroMobileImage ?? "");
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

  async function uploadHero(kind: HeroKind, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    try {
      const prefix = kind === "desktop" ? "hero-desktop" : "hero-mobile";
      const path = `${prefix}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("site-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
      const { error: rowError } = await supabase.from("site_photos").insert({
        slot: `${prefix}-${Date.now()}`,
        storage_path: path,
        alt_es: kind === "desktop" ? "Hero escritorio" : "Hero móvil",
        alt_pt: kind === "desktop" ? "Hero desktop" : "Hero mobile",
      });
      if (rowError) throw rowError;

      if (kind === "desktop") {
        await persistMedia({ heroImage: publicUrl });
        setDesktopUrl(publicUrl);
      } else {
        await persistMedia({ heroMobileImage: publicUrl });
        setMobileUrl(publicUrl);
      }
      event.target.value = "";
    } catch (error: any) {
      alert(error?.message ?? ui(lang, "No se pudo subir la imagen.", "Não foi possível enviar a imagem."));
    } finally {
      setUploading(null);
    }
  }

  async function clearHero(kind: HeroKind) {
    const label = kind === "desktop" ? ui(lang, "escritorio", "desktop") : ui(lang, "móvil", "mobile");
    if (!confirm(ui(lang, `¿Quitar la foto específica de ${label}?`, `Remover a foto específica de ${label}?`))) return;
    setRemoving(kind);
    try {
      if (kind === "desktop") {
        await persistMedia({ heroImage: "" });
        setDesktopUrl("");
      } else {
        await persistMedia({ heroMobileImage: "" });
        setMobileUrl("");
      }
    } catch (error: any) {
      alert(error?.message ?? ui(lang, "No se pudo quitar la imagen.", "Não foi possível remover a imagem."));
    } finally {
      setRemoving(null);
    }
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

  const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-foreground">
        <span>{label}</span><span className="tabular-nums text-muted-foreground">{value}%</span>
      </span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(clamp(Number(event.target.value)))} className="mt-2 w-full accent-primary" />
    </label>
  );

  const HeroCard = ({ kind }: { kind: HeroKind }) => {
    const isDesktop = kind === "desktop";
    const selectedUrl = isDesktop ? desktopUrl : mobileUrl;
    const x = isDesktop ? desktopX : mobileX;
    const y = isDesktop ? desktopY : mobileY;
    const title = isDesktop ? ui(lang, "HERO ESCRITORIO", "HERO DESKTOP") : ui(lang, "HERO MÓVIL / TABLET", "HERO MOBILE / TABLET");
    return (
      <div className={`rounded-2xl border-2 p-4 sm:p-5 ${isDesktop ? "border-foreground/15 bg-background" : "border-primary/35 bg-primary/[0.04]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.16em] ${isDesktop ? "bg-foreground text-background" : "bg-primary text-primary-foreground"}`}>{title}</span>
            <p className="mt-2 text-xs text-muted-foreground">{isDesktop ? ui(lang, "Se usa únicamente en pantallas de 1024 px o más.", "Usada somente em telas de 1024 px ou mais.") : ui(lang, "Se usa únicamente en móvil y tablet, por debajo de 1024 px.", "Usada somente em celular e tablet, abaixo de 1024 px.")}</p>
          </div>
          {selectedUrl && <button type="button" onClick={() => void clearHero(kind)} disabled={removing === kind} className="rounded-lg border border-destructive/30 px-3 py-2 text-[10px] font-bold text-destructive disabled:opacity-50">{removing === kind ? ui(lang, "Quitando…", "Removendo…") : ui(lang, "Quitar", "Remover")}</button>}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
          {selectedUrl ? (
            <img src={selectedUrl} alt={title} className={`w-full object-cover ${isDesktop ? "aspect-[16/7]" : "aspect-[4/5] max-h-[360px]"}`} style={{ objectPosition: `${x}% ${y}%` }} />
          ) : (
            <div className={`grid place-items-center px-4 text-center text-xs text-muted-foreground ${isDesktop ? "aspect-[16/7]" : "aspect-[4/5] max-h-[360px]"}`}>
              {isDesktop ? ui(lang, "No hay una foto específica elegida para escritorio.", "Nenhuma foto específica escolhida para desktop.") : ui(lang, "No hay una foto específica elegida para móvil/tablet.", "Nenhuma foto específica escolhida para celular/tablet.")}
            </div>
          )}
        </div>

        <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-background px-4 text-center text-xs font-bold transition hover:border-primary hover:bg-primary/5">
          {uploading === kind ? ui(lang, "Subiendo…", "Enviando…") : isDesktop ? ui(lang, "Elegir / cambiar foto de escritorio", "Escolher / trocar foto do desktop") : ui(lang, "Elegir / cambiar foto móvil", "Escolher / trocar foto mobile")}
          <input type="file" accept="image/*" onChange={(event) => void uploadHero(kind, event)} disabled={uploading !== null} className="sr-only" />
        </label>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-primary/[0.035] p-5 sm:p-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{ui(lang, "Hero responsive", "Hero responsivo")}</p>
        <h2 className="mt-1 font-display text-xl">{ui(lang, "Fotos separadas para desktop y móvil", "Fotos separadas para desktop e mobile")}</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">{ui(lang, "Desktop y móvil son dos selecciones independientes. La foto elegida para móvil NO reemplaza la de escritorio, y la foto de escritorio NO reemplaza la móvil.", "Desktop e mobile são duas seleções independentes. A foto escolhida para mobile NÃO substitui a do desktop, e a foto do desktop NÃO substitui a mobile.")}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <HeroCard kind="desktop" />
        <HeroCard kind="mobile" />
      </div>

      {!mobileUrl && desktopUrl && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-foreground">
          {ui(lang, "Aviso: todavía no elegiste una foto móvil específica. Hasta que la elijas, el sitio usará la foto de escritorio como respaldo en móvil.", "Aviso: você ainda não escolheu uma foto mobile específica. Até escolher, o site usará a foto do desktop como fallback no mobile.")}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{ui(lang, "Posición de escritorio", "Posição do desktop")}</p><p className="mt-1 text-[11px] text-muted-foreground">{ui(lang, "Afecta solo la foto desktop.", "Afeta somente a foto desktop.")}</p></div><button type="button" onClick={() => { setDesktopX(50); setDesktopY(50); }} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">{ui(lang, "Centrar", "Centralizar")}</button></div>
          <div className="grid gap-4"><Slider label={ui(lang, "Horizontal · izquierda ↔ derecha", "Horizontal · esquerda ↔ direita")} value={desktopX} onChange={setDesktopX} /><Slider label={ui(lang, "Vertical · arriba ↕ abajo", "Vertical · cima ↕ baixo")} value={desktopY} onChange={setDesktopY} /></div>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{ui(lang, "Posición de móvil / tablet", "Posição do mobile / tablet")}</p><p className="mt-1 text-[11px] text-muted-foreground">{ui(lang, "Afecta solo la foto móvil.", "Afeta somente a foto mobile.")}</p></div><button type="button" onClick={() => { setMobileX(50); setMobileY(50); }} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">{ui(lang, "Centrar", "Centralizar")}</button></div>
          <div className="grid gap-4"><Slider label={ui(lang, "Horizontal · izquierda ↔ derecha", "Horizontal · esquerda ↔ direita")} value={mobileX} onChange={setMobileX} /><Slider label={ui(lang, "Vertical · arriba ↕ abajo", "Vertical · cima ↕ baixo")} value={mobileY} onChange={setMobileY} /></div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={savePosition} disabled={savingPosition} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{savingPosition ? ui(lang, "Guardando posición…", "Salvando posição…") : ui(lang, "Guardar posiciones", "Salvar posições")}</button>
        {savedPosition && <span className="text-xs font-semibold text-primary">{ui(lang, "✓ Posiciones guardadas", "✓ Posições salvas")}</span>}
      </div>
    </section>
  );
}
