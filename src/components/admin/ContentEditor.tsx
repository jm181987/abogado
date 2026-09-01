import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";
import { resolveSiteContent, type Content } from "@/lib/site-content";
import { MobileHeroAdmin } from "@/components/admin/MobileHeroAdmin";
import { PracticeAreasAdmin } from "@/components/admin/PracticeAreasAdmin";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;
const MANAGED_KEYS = ["brand", "nav", "hero", "about", "contact", "theme", "footer", "whatsapp"] as const;

function managedContent(content: any) {
  return MANAGED_KEYS.reduce((out, key) => {
    if (content?.[key] !== undefined) out[key] = content[key];
    return out;
  }, {} as Record<string, unknown>);
}

export function ContentEditor({ uiLang = "es" }: { uiLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(uiLang);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { setLang(uiLang); }, [uiLang]);

  async function load(l: Lang) {
    setLoading(true); setSaved(false);
    const { data, error } = await supabase.from("site_content").select("data").eq("lang", l).maybeSingle();
    if (error) {
      alert(ui(uiLang, "No se pudo cargar el contenido publicado: ", "Não foi possível carregar o conteúdo publicado: ") + error.message);
      setLoading(false);
      return;
    }
    setContent(resolveSiteContent(l, data?.data ?? {}) as Content);
    setLoading(false);
  }

  useEffect(() => { void load(lang); }, [lang]);

  async function save() {
    if (!content || saving) return;
    setSaving(true); setSaved(false);
    try {
      const { data: currentRow, error: readError } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
      if (readError) throw readError;

      const currentRaw: any = currentRow?.data ?? {};
      const managed = managedContent(content);
      // Solo reemplazamos las secciones que este formulario edita.
      // Hero media, áreas y profesionales se preservan desde la fila más reciente para
      // que un Guardar general no pueda revertir cambios hechos segundos antes.
      const next = { ...currentRaw, ...managed };
      const { error: writeError } = await supabase.from("site_content").upsert(
        { lang, data: next, updated_at: new Date().toISOString() },
        { onConflict: "lang" },
      );
      if (writeError) throw writeError;

      // Verificación real de persistencia: no mostramos “Publicado” hasta leer de nuevo
      // la fila y confirmar que Supabase mantuvo exactamente las secciones editadas.
      const { data: verifiedRow, error: verifyError } = await supabase.from("site_content").select("data").eq("lang", lang).maybeSingle();
      if (verifyError) throw verifyError;
      const verifiedRaw: any = verifiedRow?.data ?? {};
      const mismatch = Object.entries(managed).some(([key, value]) => JSON.stringify(verifiedRaw?.[key]) !== JSON.stringify(value));
      if (mismatch) throw new Error(ui(uiLang, "Supabase no confirmó todos los cambios guardados. Intenta nuevamente.", "O Supabase não confirmou todas as alterações salvas. Tente novamente."));

      setContent(resolveSiteContent(lang, verifiedRaw) as Content);
      await queryClient.invalidateQueries({ queryKey: ["site_content"] });
      await queryClient.refetchQueries({ queryKey: ["site_content"], type: "active" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (error: any) {
      alert(error?.message ?? ui(uiLang, "No se pudo guardar el contenido.", "Não foi possível salvar o conteúdo."));
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    if (!confirm(ui(uiLang, "¿Restaurar los textos base de este idioma? No se guardarán hasta pulsar Guardar.", "Restaurar os textos base deste idioma? Eles só serão salvos ao clicar em Salvar."))) return;
    setContent(resolveSiteContent(lang, translations[lang]) as Content);
  }

  function set(path: string, value: string) {
    setContent(prev => {
      if (!prev) return prev;
      const clone: any = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
        obj = obj[key];
      }
      obj[parts[parts.length - 1]] = value;
      return clone;
    });
  }

  function get(path: string): string {
    if (!content) return "";
    let obj: any = content;
    for (const key of path.split(".")) {
      obj = obj?.[key];
      if (obj == null) return "";
    }
    return typeof obj === "string" ? obj : "";
  }

  if (loading || !content) return <p className="text-sm text-muted-foreground">{ui(uiLang, "Cargando contenido publicado…", "Carregando conteúdo publicado…")}</p>;

  return (
    <div className="space-y-6">
      <div className="sticky top-[132px] z-20 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{ui(uiLang, "Contenido real de la homepage", "Conteúdo real da homepage")}</p>
          <div className="mt-1 flex w-fit items-center rounded-full border border-border bg-background p-0.5 text-xs">
            <button onClick={() => setLang("es")} className={`rounded-full px-4 py-1.5 ${lang === "es" ? "bg-primary text-primary-foreground" : ""}`}>Español</button>
            <button onClick={() => setLang("pt")} className={`rounded-full px-4 py-1.5 ${lang === "pt" ? "bg-primary text-primary-foreground" : ""}`}>Português</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && <span className="text-xs font-semibold text-primary">✓ {ui(uiLang, "Publicado y verificado", "Publicado e verificado")}</span>}
          <button onClick={resetDefaults} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground">{ui(uiLang, "Restaurar base", "Restaurar base")}</button>
          <button onClick={save} disabled={saving} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving ? ui(uiLang, "Publicando…", "Publicando…") : ui(uiLang, "Guardar y publicar", "Salvar e publicar")}</button>
        </div>
      </div>

      <Notice lang={uiLang} />

      <Section title={ui(uiLang, "Marca y navegación", "Marca e navegação")}>
        <Grid>
          <Field label={ui(uiLang, "Nombre principal", "Nome principal")} v={get("brand.name1")} on={v => set("brand.name1", v)} />
          <Field label={ui(uiLang, "Nombre secundario", "Nome secundário")} v={get("brand.name2")} on={v => set("brand.name2", v)} />
          <Field label={ui(uiLang, "URL del logo", "URL do logotipo")} v={get("brand.logoUrl")} on={v => set("brand.logoUrl", v)} full />
          <Field label={ui(uiLang, "Inicio", "Início")} v={get("nav.home")} on={v => set("nav.home", v)} />
          <Field label={ui(uiLang, "El Estudio", "O Escritório")} v={get("nav.about")} on={v => set("nav.about", v)} />
          <Field label={ui(uiLang, "Áreas de Actuación", "Áreas de Atuação")} v={get("nav.plans")} on={v => set("nav.plans", v)} />
          <Field label={ui(uiLang, "Profesionales", "Profissionais")} v={get("nav.diff")} on={v => set("nav.diff", v)} />
          <Field label={ui(uiLang, "Contacto", "Contato")} v={get("nav.cta")} on={v => set("nav.cta", v)} />
        </Grid>
      </Section>

      <Section title={ui(uiLang, "Hero / portada", "Hero / capa")}>
        <Grid>
          <Field label="Badge" v={get("hero.badge")} on={v => set("hero.badge", v)} full />
          <Field label={ui(uiLang, "Título parte 1", "Título parte 1")} v={get("hero.title1")} on={v => set("hero.title1", v)} />
          <Field label={ui(uiLang, "Título parte 2", "Título parte 2")} v={get("hero.title2")} on={v => set("hero.title2", v)} />
          <Field label={ui(uiLang, "Descripción", "Descrição")} v={get("hero.desc")} on={v => set("hero.desc", v)} full area />
          <Field label={ui(uiLang, "Botón áreas", "Botão áreas")} v={get("hero.ctaPlans")} on={v => set("hero.ctaPlans", v)} />
          <Field label="WhatsApp" v={get("hero.ctaWhats")} on={v => set("hero.ctaWhats", v)} />
        </Grid>
      </Section>

      <MobileHeroAdmin lang={lang} />

      <Section title={ui(uiLang, "El Estudio", "O Escritório")}>
        <Grid>
          <Field label="Kicker" v={get("about.kicker")} on={v => set("about.kicker", v)} />
          <Field label={ui(uiLang, "Título", "Título")} v={get("about.title")} on={v => set("about.title", v)} />
          <Field label={ui(uiLang, "Texto principal", "Texto principal")} v={get("about.body")} on={v => set("about.body", v)} full area />
        </Grid>
      </Section>

      <PracticeAreasAdmin lang={lang} />

      <Section title={ui(uiLang, "Contacto", "Contato")}>
        <Grid>
          <Field label="Kicker" v={get("contact.kicker")} on={v => set("contact.kicker", v)} />
          <Field label={ui(uiLang, "Título", "Título")} v={get("contact.title")} on={v => set("contact.title", v)} />
          <Field label={ui(uiLang, "Título ubicación", "Título endereço")} v={get("contact.location")} on={v => set("contact.location", v)} />
          <Field label={ui(uiLang, "Dirección línea 1", "Endereço linha 1")} v={get("contact.address1")} on={v => set("contact.address1", v)} />
          <Field label={ui(uiLang, "Dirección línea 2", "Endereço linha 2")} v={get("contact.address2")} on={v => set("contact.address2", v)} />
          <Field label={ui(uiLang, "Estacionamiento", "Estacionamento")} v={get("contact.parking")} on={v => set("contact.parking", v)} full />
          <Field label={ui(uiLang, "Cómo llegar", "Como chegar")} v={get("contact.howto")} on={v => set("contact.howto", v)} />
          <Field label={ui(uiLang, "Indicaciones 1", "Indicações 1")} v={get("contact.howto1")} on={v => set("contact.howto1", v)} />
          <Field label={ui(uiLang, "Indicaciones 2", "Indicações 2")} v={get("contact.howto2")} on={v => set("contact.howto2", v)} />
          <Field label={ui(uiLang, "Indicaciones 3", "Indicações 3")} v={get("contact.howto3")} on={v => set("contact.howto3", v)} />
          <Field label={ui(uiLang, "Horarios", "Horários")} v={get("contact.hours")} on={v => set("contact.hours", v)} />
          <Field label={ui(uiLang, "Horario 1", "Horário 1")} v={get("contact.hours1")} on={v => set("contact.hours1", v)} />
          <Field label={ui(uiLang, "Horario 2", "Horário 2")} v={get("contact.hours2")} on={v => set("contact.hours2", v)} />
          <Field label={ui(uiLang, "Horario 3", "Horário 3")} v={get("contact.hours3")} on={v => set("contact.hours3", v)} />
          <Field label="WhatsApp" v={get("contact.whats")} on={v => set("contact.whats", v)} />
        </Grid>
      </Section>

      <Section title={ui(uiLang, "Colores del sitio", "Cores do site")}>
        <Grid>
          <ColorField label={ui(uiLang, "Primario", "Primário")} v={get("theme.primary")} on={v => set("theme.primary", v)} />
          <ColorField label={ui(uiLang, "Texto sobre primario", "Texto sobre primário")} v={get("theme.primaryForeground")} on={v => set("theme.primaryForeground", v)} />
          <ColorField label={ui(uiLang, "Secundario", "Secundário")} v={get("theme.secondary")} on={v => set("theme.secondary", v)} />
          <ColorField label={ui(uiLang, "Acento", "Destaque")} v={get("theme.accent")} on={v => set("theme.accent", v)} />
          <ColorField label={ui(uiLang, "Fondo", "Fundo")} v={get("theme.background")} on={v => set("theme.background", v)} />
          <ColorField label={ui(uiLang, "Texto", "Texto")} v={get("theme.foreground")} on={v => set("theme.foreground", v)} />
          <ColorField label={ui(uiLang, "Fondo suave", "Fundo suave")} v={get("theme.muted")} on={v => set("theme.muted", v)} />
          <ColorField label={ui(uiLang, "Texto suave", "Texto suave")} v={get("theme.mutedForeground")} on={v => set("theme.mutedForeground", v)} />
          <ColorField label={ui(uiLang, "Bordes", "Bordas")} v={get("theme.border")} on={v => set("theme.border", v)} />
        </Grid>
      </Section>

      <Section title="Footer"><Grid><Field label={ui(uiLang, "Texto", "Texto")} v={get("footer")} on={v => set("footer", v)} full /></Grid></Section>
    </div>
  );
}

function Notice({ lang }: { lang: Lang }) {
  return <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-foreground/80">{ui(lang, "Cada bloque guarda sobre la versión más reciente de Supabase. El botón general ya no puede sobrescribir fotos, posiciones, áreas ni profesionales con una copia vieja, y solo confirma el guardado después de verificarlo en la base de datos.", "Cada bloco salva sobre a versão mais recente do Supabase. O botão geral não pode mais sobrescrever fotos, posições, áreas ou profissionais com uma cópia antiga e só confirma o salvamento depois de verificá-lo no banco de dados.")}</div>;
}

function ColorField({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span><div className="flex items-center gap-2"><input type="color" value={isHex ? v : "#5b1820"} onChange={e => on(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-background" /><input value={v} onChange={e => on(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />{v && <button type="button" onClick={() => on("")} className="px-2 text-xs text-muted-foreground">✕</button>}</div></label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 font-display text-lg">{title}</h3>{children}</div>; }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 md:grid-cols-2">{children}</div>; }
function Field({ label, v, on, full, area }: { label: string; v: string; on: (v: string) => void; full?: boolean; area?: boolean }) { return <label className={`block ${full ? "md:col-span-2" : ""}`}><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{area ? <textarea rows={5} value={v} onChange={e => on(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /> : <input value={v} onChange={e => on(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />}</label>; }
