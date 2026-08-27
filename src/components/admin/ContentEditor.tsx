import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";
import { deepMerge, type Content } from "@/lib/site-content";

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

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
    const { data } = await supabase.from("site_content").select("data").eq("lang", l).maybeSingle();
    setContent(deepMerge(translations[l], data?.data ?? {}) as Content);
    setLoading(false);
  }
  useEffect(() => { void load(lang); }, [lang]);

  async function save() {
    if (!content) return;
    setSaving(true); setSaved(false);
    const { error } = await supabase.from("site_content").upsert({ lang, data: content as any, updated_at: new Date().toISOString() }, { onConflict: "lang" });
    setSaving(false);
    if (error) { alert(error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function resetDefaults() {
    if (!confirm(ui(uiLang, "¿Restaurar valores por defecto de este idioma? Los cambios no se guardan hasta pulsar Guardar.", "Restaurar os valores padrão deste idioma? As alterações só serão salvas ao clicar em Salvar."))) return;
    setContent(JSON.parse(JSON.stringify(translations[lang])) as Content);
  }

  function set(path: string, value: string) {
    setContent(prev => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj: any = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]; const idx = key.match(/^(\w+)\[(\d+)\]$/);
        obj = idx ? obj[idx[1]][Number(idx[2])] : obj[key];
      }
      obj[parts[parts.length - 1]] = value;
      return clone;
    });
  }

  function get(path: string): string {
    if (!content) return "";
    let obj: any = content;
    for (const key of path.split(".")) {
      const idx = key.match(/^(\w+)\[(\d+)\]$/);
      obj = idx ? obj?.[idx[1]]?.[Number(idx[2])] : obj?.[key];
      if (obj == null) return "";
    }
    return typeof obj === "string" ? obj : "";
  }

  if (loading || !content) return <p className="text-sm text-muted-foreground">{ui(uiLang, "Cargando…", "Carregando…")}</p>;

  return (
    <div className="space-y-6">
      <div className="sticky top-[132px] z-20 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{ui(uiLang, "Idioma del contenido que editas", "Idioma do conteúdo em edição")}</p>
          <div className="mt-1 flex items-center rounded-full border border-border p-0.5 text-xs bg-background w-fit">
            <button onClick={() => setLang("es")} className={`rounded-full px-4 py-1.5 ${lang === "es" ? "bg-primary text-primary-foreground" : ""}`}>Español</button>
            <button onClick={() => setLang("pt")} className={`rounded-full px-4 py-1.5 ${lang === "pt" ? "bg-primary text-primary-foreground" : ""}`}>Português</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && <span className="text-xs text-primary">✓ {ui(uiLang, "Guardado", "Salvo")}</span>}
          <button onClick={resetDefaults} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground">{ui(uiLang, "Restaurar valores", "Restaurar valores")}</button>
          <button onClick={save} disabled={saving} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving ? ui(uiLang, "Guardando…", "Salvando…") : ui(uiLang, "Guardar cambios", "Salvar alterações")}</button>
        </div>
      </div>

      <Section title={ui(uiLang, "Marca y WhatsApp", "Marca e WhatsApp")}>
        <p className="text-xs text-muted-foreground mb-3">{ui(uiLang, "Nombre, logo y contacto general usados en el sitio.", "Nome, logotipo e contato geral usados no site.")}</p>
        <Grid>
          <Field label={ui(uiLang, "Nombre principal", "Nome principal")} v={get("brand.name1")} on={v => set("brand.name1", v)} />
          <Field label={ui(uiLang, "Nombre secundario", "Nome secundário")} v={get("brand.name2")} on={v => set("brand.name2", v)} />
          <Field label={ui(uiLang, "URL del logo (opcional)", "URL do logotipo (opcional)")} v={get("brand.logoUrl")} on={v => set("brand.logoUrl", v)} full />
          <Field label={ui(uiLang, "WhatsApp — solo dígitos", "WhatsApp — somente números")} v={get("whatsapp.number")} on={v => set("whatsapp.number", v)} />
          <Field label={ui(uiLang, "WhatsApp — formato visible", "WhatsApp — formato visível")} v={get("whatsapp.display")} on={v => set("whatsapp.display", v)} />
        </Grid>
      </Section>

      <Section title={ui(uiLang, "Navegación", "Navegação")}><Grid>
        <Field label={ui(uiLang, "Inicio", "Início")} v={get("nav.home")} on={v => set("nav.home", v)} /><Field label={ui(uiLang, "Servicios", "Serviços")} v={get("nav.plans")} on={v => set("nav.plans", v)} /><Field label={ui(uiLang, "Nosotros", "Sobre nós")} v={get("nav.about")} on={v => set("nav.about", v)} /><Field label={ui(uiLang, "Diferenciadores", "Diferenciais")} v={get("nav.diff")} on={v => set("nav.diff", v)} /><Field label={ui(uiLang, "Contacto", "Contato")} v={get("nav.contact")} on={v => set("nav.contact", v)} /><Field label={ui(uiLang, "Botón principal", "Botão principal")} v={get("nav.cta")} on={v => set("nav.cta", v)} />
      </Grid></Section>

      <Section title={ui(uiLang, "Portada", "Capa")}><Grid>
        <Field label="Badge" v={get("hero.badge")} on={v => set("hero.badge", v)} full /><Field label={ui(uiLang, "Título parte 1", "Título parte 1")} v={get("hero.title1")} on={v => set("hero.title1", v)} /><Field label={ui(uiLang, "Título parte 2", "Título parte 2")} v={get("hero.title2")} on={v => set("hero.title2", v)} /><Field label={ui(uiLang, "Descripción", "Descrição")} v={get("hero.desc")} on={v => set("hero.desc", v)} full area /><Field label={ui(uiLang, "Botón servicios", "Botão serviços")} v={get("hero.ctaPlans")} on={v => set("hero.ctaPlans", v)} /><Field label="WhatsApp" v={get("hero.ctaWhats")} on={v => set("hero.ctaWhats", v)} />
      </Grid></Section>

      <Section title={ui(uiLang, "Nosotros", "Sobre nós")}><Grid>
        <Field label="Kicker" v={get("about.kicker")} on={v => set("about.kicker", v)} /><Field label={ui(uiLang, "Título", "Título")} v={get("about.title")} on={v => set("about.title", v)} /><Field label={ui(uiLang, "Texto principal", "Texto principal")} v={get("about.body")} on={v => set("about.body", v)} full area /><Field label={ui(uiLang, "Título Misión", "Título Missão")} v={get("about.mission")} on={v => set("about.mission", v)} /><Field label={ui(uiLang, "Texto Misión", "Texto Missão")} v={get("about.missionBody")} on={v => set("about.missionBody", v)} area /><Field label={ui(uiLang, "Título Visión", "Título Visão")} v={get("about.vision")} on={v => set("about.vision", v)} /><Field label={ui(uiLang, "Texto Visión", "Texto Visão")} v={get("about.visionBody")} on={v => set("about.visionBody", v)} area /><Field label={ui(uiLang, "Título Filosofía", "Título Filosofia")} v={get("about.philosophy")} on={v => set("about.philosophy", v)} /><Field label={ui(uiLang, "Texto Filosofía", "Texto Filosofia")} v={get("about.philosophyBody")} on={v => set("about.philosophyBody", v)} area />
      </Grid></Section>

      <Section title={ui(uiLang, "Encabezado de servicios", "Cabeçalho de serviços")}><Grid>
        <Field label="Kicker" v={get("plans.kicker")} on={v => set("plans.kicker", v)} /><Field label={ui(uiLang, "Título", "Título")} v={get("plans.title")} on={v => set("plans.title", v)} /><Field label={ui(uiLang, "Subtítulo", "Subtítulo")} v={get("plans.subtitle")} on={v => set("plans.subtitle", v)} full area /><Field label={ui(uiLang, "Texto de precio", "Texto de preço")} v={get("plans.perYear")} on={v => set("plans.perYear", v)} /><Field label={ui(uiLang, "Etiqueta popular", "Etiqueta popular")} v={get("plans.popular")} on={v => set("plans.popular", v)} /><Field label={ui(uiLang, "Botón consultar", "Botão consultar")} v={get("plans.consult")} on={v => set("plans.consult", v)} /><Field label={ui(uiLang, "Pie de sección", "Rodapé da seção")} v={get("plans.footnote")} on={v => set("plans.footnote", v)} full />
      </Grid></Section>

      <Section title={ui(uiLang, "Diferenciadores", "Diferenciais")}>
        <Grid><Field label="Kicker" v={get("diff.kicker")} on={v => set("diff.kicker", v)} /><Field label={ui(uiLang, "Título", "Título")} v={get("diff.title")} on={v => set("diff.title", v)} /><Field label={ui(uiLang, "Subtítulo", "Subtítulo")} v={get("diff.subtitle")} on={v => set("diff.subtitle", v)} full area /></Grid>
        <div className="mt-4 space-y-3">{[0,1,2,3,4,5].map(i => <div key={i} className="rounded-xl border border-border p-4 bg-background/50"><p className="text-xs text-muted-foreground mb-2">{ui(uiLang, "Ítem", "Item")} {i + 1}</p><Grid><Field label={ui(uiLang, "Título", "Título")} v={get(`diff.items[${i}].t`)} on={v => set(`diff.items[${i}].t`, v)} /><Field label={ui(uiLang, "Descripción", "Descrição")} v={get(`diff.items[${i}].d`)} on={v => set(`diff.items[${i}].d`, v)} area /></Grid></div>)}</div>
      </Section>

      <Section title={ui(uiLang, "Contacto", "Contato")}><Grid>
        <Field label="Kicker" v={get("contact.kicker")} on={v => set("contact.kicker", v)} /><Field label={ui(uiLang, "Título", "Título")} v={get("contact.title")} on={v => set("contact.title", v)} /><Field label={ui(uiLang, "Título ubicación", "Título endereço")} v={get("contact.location")} on={v => set("contact.location", v)} /><Field label={ui(uiLang, "Dirección línea 1", "Endereço linha 1")} v={get("contact.address1")} on={v => set("contact.address1", v)} /><Field label={ui(uiLang, "Dirección línea 2", "Endereço linha 2")} v={get("contact.address2")} on={v => set("contact.address2", v)} /><Field label={ui(uiLang, "Estacionamiento", "Estacionamento")} v={get("contact.parking")} on={v => set("contact.parking", v)} full /><Field label={ui(uiLang, "Título cómo llegar", "Título como chegar")} v={get("contact.howto")} on={v => set("contact.howto", v)} /><Field label={ui(uiLang, "Cómo llegar 1", "Como chegar 1")} v={get("contact.howto1")} on={v => set("contact.howto1", v)} /><Field label={ui(uiLang, "Cómo llegar 2", "Como chegar 2")} v={get("contact.howto2")} on={v => set("contact.howto2", v)} /><Field label={ui(uiLang, "Cómo llegar 3", "Como chegar 3")} v={get("contact.howto3")} on={v => set("contact.howto3", v)} /><Field label={ui(uiLang, "Título horarios", "Título horários")} v={get("contact.hours")} on={v => set("contact.hours", v)} /><Field label={ui(uiLang, "Horario 1", "Horário 1")} v={get("contact.hours1")} on={v => set("contact.hours1", v)} /><Field label={ui(uiLang, "Horario 2", "Horário 2")} v={get("contact.hours2")} on={v => set("contact.hours2", v)} /><Field label={ui(uiLang, "Horario 3", "Horário 3")} v={get("contact.hours3")} on={v => set("contact.hours3", v)} /><Field label="WhatsApp" v={get("contact.whats")} on={v => set("contact.whats", v)} />
      </Grid></Section>

      <Section title={ui(uiLang, "Colores del sitio", "Cores do site")}><p className="text-xs text-muted-foreground mb-3">{ui(uiLang, "Usa códigos HEX. Déjalo vacío para mantener el color por defecto.", "Use códigos HEX. Deixe vazio para manter a cor padrão.")}</p><Grid>
        <ColorField label={ui(uiLang, "Primario", "Primário")} v={get("theme.primary")} on={v => set("theme.primary", v)} /><ColorField label={ui(uiLang, "Texto sobre primario", "Texto sobre primário")} v={get("theme.primaryForeground")} on={v => set("theme.primaryForeground", v)} /><ColorField label={ui(uiLang, "Secundario", "Secundário")} v={get("theme.secondary")} on={v => set("theme.secondary", v)} /><ColorField label={ui(uiLang, "Acento", "Destaque")} v={get("theme.accent")} on={v => set("theme.accent", v)} /><ColorField label={ui(uiLang, "Fondo general", "Fundo geral")} v={get("theme.background")} on={v => set("theme.background", v)} /><ColorField label={ui(uiLang, "Texto general", "Texto geral")} v={get("theme.foreground")} on={v => set("theme.foreground", v)} /><ColorField label={ui(uiLang, "Fondo suave", "Fundo suave")} v={get("theme.muted")} on={v => set("theme.muted", v)} /><ColorField label={ui(uiLang, "Texto suave", "Texto suave")} v={get("theme.mutedForeground")} on={v => set("theme.mutedForeground", v)} /><ColorField label={ui(uiLang, "Bordes", "Bordas")} v={get("theme.border")} on={v => set("theme.border", v)} />
      </Grid></Section>

      <Section title="Footer"><Grid><Field label={ui(uiLang, "Texto", "Texto")} v={get("footer")} on={v => set("footer", v)} full /></Grid></Section>
    </div>
  );
}

function ColorField({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
  return <label className="block"><span className="block text-xs font-medium mb-1 text-muted-foreground">{label}</span><div className="flex items-center gap-2"><input type="color" value={isHex ? v : "#4a9d85"} onChange={e => on(e.target.value)} className="h-9 w-12 rounded border border-input bg-background cursor-pointer" /><input value={v} onChange={e => on(e.target.value)} placeholder="#4a9d85" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />{v && <button type="button" onClick={() => on("")} className="text-xs text-muted-foreground px-2">✕</button>}</div></label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg mb-4">{title}</h3>{children}</div>; }
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 md:grid-cols-2">{children}</div>; }
function Field({ label, v, on, full, area }: { label: string; v: string; on: (v: string) => void; full?: boolean; area?: boolean }) { return <label className={`block ${full ? "md:col-span-2" : ""}`}><span className="block text-xs font-medium mb-1 text-muted-foreground">{label}</span>{area ? <textarea rows={3} value={v} onChange={e => on(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /> : <input value={v} onChange={e => on(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />}</label>; }
