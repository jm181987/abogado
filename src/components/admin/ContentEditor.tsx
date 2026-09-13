import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileHeroAdmin } from "@/components/admin/MobileHeroAdmin";
import { PracticeAreasAdmin } from "@/components/admin/PracticeAreasAdmin";
import { dataClient } from "@/lib/data-client";
import { translations, type Lang } from "@/lib/i18n";
import { resolveSiteContent, type Content } from "@/lib/site-content";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;
const MANAGED_KEYS = ["brand", "nav", "hero", "about", "contact", "theme", "footer", "whatsapp"] as const;

type FieldDef = { path: string; es: string; pt?: string; full?: boolean; area?: boolean };
type SectionDef = { es: string; pt?: string; fields: FieldDef[] };

const sections: SectionDef[] = [
  {
    es: "Marca y navegación", pt: "Marca e navegação", fields: [
      { path: "brand.name1", es: "Nombre principal", pt: "Nome principal" },
      { path: "brand.name2", es: "Nombre secundario", pt: "Nome secundário" },
      { path: "brand.logoUrl", es: "URL del logo", pt: "URL do logotipo", full: true },
      { path: "nav.home", es: "Inicio", pt: "Início" },
      { path: "nav.about", es: "El Estudio", pt: "O Escritório" },
      { path: "nav.plans", es: "Áreas de Actuación", pt: "Áreas de Atuação" },
      { path: "nav.diff", es: "Profesionales", pt: "Profissionais" },
      { path: "nav.cta", es: "Contacto", pt: "Contato" },
    ],
  },
  {
    es: "Hero / portada", pt: "Hero / capa", fields: [
      { path: "hero.badge", es: "Badge", full: true },
      { path: "hero.title1", es: "Título parte 1" },
      { path: "hero.title2", es: "Título parte 2" },
      { path: "hero.desc", es: "Descripción", pt: "Descrição", full: true, area: true },
      { path: "hero.ctaPlans", es: "Botón áreas", pt: "Botão áreas" },
      { path: "hero.ctaWhats", es: "WhatsApp" },
    ],
  },
  {
    es: "El Estudio", pt: "O Escritório", fields: [
      { path: "about.kicker", es: "Kicker" },
      { path: "about.title", es: "Título" },
      { path: "about.body", es: "Texto principal", full: true, area: true },
    ],
  },
  {
    es: "Contacto", pt: "Contato", fields: [
      { path: "contact.kicker", es: "Kicker" },
      { path: "contact.title", es: "Título" },
      { path: "contact.location", es: "Título ubicación", pt: "Título endereço" },
      { path: "contact.address1", es: "Dirección línea 1", pt: "Endereço linha 1" },
      { path: "contact.address2", es: "Dirección línea 2", pt: "Endereço linha 2" },
      { path: "contact.parking", es: "Estacionamiento", pt: "Estacionamento", full: true },
      { path: "contact.howto", es: "Cómo llegar", pt: "Como chegar" },
      { path: "contact.howto1", es: "Indicaciones 1", pt: "Indicações 1" },
      { path: "contact.howto2", es: "Indicaciones 2", pt: "Indicações 2" },
      { path: "contact.howto3", es: "Indicaciones 3", pt: "Indicações 3" },
      { path: "contact.hours", es: "Horarios", pt: "Horários" },
      { path: "contact.hours1", es: "Horario 1", pt: "Horário 1" },
      { path: "contact.hours2", es: "Horario 2", pt: "Horário 2" },
      { path: "contact.hours3", es: "Horario 3", pt: "Horário 3" },
      { path: "contact.whats", es: "WhatsApp" },
    ],
  },
];

const colorFields: FieldDef[] = [
  { path: "theme.primary", es: "Primario", pt: "Primário" },
  { path: "theme.primaryForeground", es: "Texto sobre primario", pt: "Texto sobre primário" },
  { path: "theme.secondary", es: "Secundario", pt: "Secundário" },
  { path: "theme.accent", es: "Acento", pt: "Destaque" },
  { path: "theme.background", es: "Fondo", pt: "Fundo" },
  { path: "theme.foreground", es: "Texto" },
  { path: "theme.muted", es: "Fondo suave", pt: "Fundo suave" },
  { path: "theme.mutedForeground", es: "Texto suave" },
  { path: "theme.border", es: "Bordes", pt: "Bordas" },
];

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
  useEffect(() => { void load(lang); }, [lang]);

  async function load(value: Lang) {
    setLoading(true);
    setSaved(false);
    const { data, error } = await dataClient.from("site_content").select("data").eq("lang", value).maybeSingle();
    if (error) {
      alert(ui(uiLang, "No se pudo cargar el contenido publicado: ", "Não foi possível carregar o conteúdo publicado: ") + error.message);
      setLoading(false);
      return;
    }
    setContent(resolveSiteContent(value, data?.data ?? {}) as Content);
    setLoading(false);
  }

  async function save() {
    if (!content || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const { data: currentRow, error: readError } = await dataClient.from("site_content").select("data").eq("lang", lang).maybeSingle();
      if (readError) throw readError;
      const currentRaw: any = currentRow?.data ?? {};
      const managed = managedContent(content);
      const { error: writeError } = await dataClient.from("site_content").upsert({
        lang,
        data: { ...currentRaw, ...managed },
        updated_at: new Date().toISOString(),
      }, { onConflict: "lang" });
      if (writeError) throw writeError;

      const { data: verifiedRow, error: verifyError } = await dataClient.from("site_content").select("data").eq("lang", lang).maybeSingle();
      if (verifyError) throw verifyError;
      const verifiedRaw: any = verifiedRow?.data ?? {};
      const mismatch = Object.entries(managed).some(([key, value]) => JSON.stringify(verifiedRaw?.[key]) !== JSON.stringify(value));
      if (mismatch) throw new Error(ui(uiLang, "La base de datos no confirmó todos los cambios guardados. Intenta nuevamente.", "O banco de dados não confirmou todas as alterações salvas. Tente novamente."));

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
    setContent(previous => {
      if (!previous) return previous;
      const clone: any = JSON.parse(JSON.stringify(previous));
      const parts = path.split(".");
      let target = clone;
      for (let index = 0; index < parts.length - 1; index++) {
        const key = parts[index];
        if (!target[key] || typeof target[key] !== "object") target[key] = {};
        target = target[key];
      }
      target[parts[parts.length - 1]] = value;
      return clone;
    });
  }

  function get(path: string) {
    let value: any = content;
    for (const key of path.split(".")) value = value?.[key];
    return typeof value === "string" ? value : "";
  }

  if (loading || !content) return <p className="text-sm text-muted-foreground">{ui(uiLang, "Cargando contenido publicado…", "Carregando conteúdo publicado…")}</p>;

  return (
    <div className="space-y-6">
      <div className="sticky top-[132px] z-20 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{ui(uiLang, "Contenido real de la homepage", "Conteúdo real da homepage")}</p>
          <div className="mt-1 flex w-fit items-center rounded-full border border-border bg-background p-0.5 text-xs">
            {(["es", "pt"] as const).map(value => <button key={value} onClick={() => setLang(value)} className={`rounded-full px-4 py-1.5 ${lang === value ? "bg-primary text-primary-foreground" : ""}`}>{value === "es" ? "Español" : "Português"}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && <span className="text-xs font-semibold text-primary">✓ {ui(uiLang, "Publicado y verificado", "Publicado e verificado")}</span>}
          <button onClick={resetDefaults} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground">{ui(uiLang, "Restaurar base", "Restaurar base")}</button>
          <button onClick={save} disabled={saving} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving ? ui(uiLang, "Publicando…", "Publicando…") : ui(uiLang, "Guardar y publicar", "Salvar e publicar")}</button>
        </div>
      </div>

      <Notice lang={uiLang} />
      {sections.slice(0, 2).map(section => <EditorSection key={section.es} section={section} lang={uiLang} get={get} set={set} />)}
      <MobileHeroAdmin lang={lang} />
      <EditorSection section={sections[2]} lang={uiLang} get={get} set={set} />
      <PracticeAreasAdmin lang={lang} />
      <EditorSection section={sections[3]} lang={uiLang} get={get} set={set} />

      <Section title={ui(uiLang, "Colores del sitio", "Cores do site")}>
        <Grid>{colorFields.map(field => <ColorField key={field.path} label={ui(uiLang, field.es, field.pt ?? field.es)} value={get(field.path)} onChange={value => set(field.path, value)} />)}</Grid>
      </Section>
      <Section title="Footer"><Grid><TextField label={ui(uiLang, "Texto", "Texto")} value={get("footer")} onChange={value => set("footer", value)} full /></Grid></Section>
    </div>
  );
}

function EditorSection({ section, lang, get, set }: { section: SectionDef; lang: Lang; get: (path: string) => string; set: (path: string, value: string) => void }) {
  return <Section title={ui(lang, section.es, section.pt ?? section.es)}><Grid>{section.fields.map(field => <TextField key={field.path} label={ui(lang, field.es, field.pt ?? field.es)} value={get(field.path)} onChange={value => set(field.path, value)} full={field.full} area={field.area} />)}</Grid></Section>;
}

function Notice({ lang }: { lang: Lang }) {
  return <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-foreground/80">{ui(lang, "Cada bloque guarda sobre la versión más reciente de PostgreSQL. El guardado general preserva fotos, posiciones, áreas y profesionales y solo confirma después de verificar la base de datos.", "Cada bloco salva sobre a versão mais recente do PostgreSQL. O salvamento geral preserva fotos, posições, áreas e profissionais e só confirma depois de verificar o banco de dados.")}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 font-display text-lg">{title}</h3>{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function TextField({ label, value, onChange, full, area }: { label: string; value: string; onChange: (value: string) => void; full?: boolean; area?: boolean }) {
  return <label className={`block ${full ? "md:col-span-2" : ""}`}><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{area ? <textarea rows={5} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /> : <input value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />}</label>;
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span><div className="flex items-center gap-2"><input type="color" value={isHex ? value : "#5b1820"} onChange={event => onChange(event.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-background" /><input value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />{value && <button type="button" onClick={() => onChange("")} className="px-2 text-xs text-muted-foreground">✕</button>}</div></label>;
}
