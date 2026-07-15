import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";
import { deepMerge, type Content } from "@/lib/site-content";

export function ContentEditor() {
  const [lang, setLang] = useState<Lang>("es");
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load(l: Lang) {
    setLoading(true); setSaved(false);
    const { data } = await supabase.from("site_content").select("data").eq("lang", l).maybeSingle();
    setContent(deepMerge(translations[l], data?.data ?? {}) as Content);
    setLoading(false);
  }
  useEffect(() => { load(lang); }, [lang]);

  async function save() {
    if (!content) return;
    setSaving(true); setSaved(false);
    const { error } = await supabase.from("site_content")
      .update({ data: content as any, updated_at: new Date().toISOString() })
      .eq("lang", lang);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetDefaults() {
    if (!confirm("¿Restaurar valores por defecto de este idioma? (No se guarda hasta que hagas clic en Guardar)")) return;
    setContent(JSON.parse(JSON.stringify(translations[lang])) as Content);
  }

  function set(path: string, value: string) {
    setContent(prev => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj: any = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        const idx = k.match(/^(\w+)\[(\d+)\]$/);
        if (idx) { obj = obj[idx[1]][Number(idx[2])]; }
        else obj = obj[k];
      }
      obj[parts[parts.length - 1]] = value;
      return clone;
    });
  }

  function get(path: string): string {
    if (!content) return "";
    const parts = path.split(".");
    let obj: any = content;
    for (const k of parts) {
      const idx = k.match(/^(\w+)\[(\d+)\]$/);
      if (idx) obj = obj?.[idx[1]]?.[Number(idx[2])];
      else obj = obj?.[k];
      if (obj == null) return "";
    }
    return typeof obj === "string" ? obj : "";
  }

  if (loading || !content) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-muted/80 backdrop-blur -mx-6 px-6 py-3 border-b border-border">
        <div className="flex items-center rounded-full border border-border p-0.5 text-xs bg-background">
          <button onClick={() => setLang("es")}
            className={`rounded-full px-4 py-1.5 ${lang === "es" ? "bg-primary text-primary-foreground" : ""}`}>Español</button>
          <button onClick={() => setLang("pt")}
            className={`rounded-full px-4 py-1.5 ${lang === "pt" ? "bg-primary text-primary-foreground" : ""}`}>Português</button>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-primary">✓ Guardado</span>}
          <button onClick={resetDefaults} className="text-xs text-muted-foreground hover:text-foreground">Restaurar defaults</button>
          <button onClick={save} disabled={saving}
            className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-medium disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Nav */}
      <Section title="Navegación">
        <Grid>
          <Field label="Inicio" v={get("nav.home")} on={v => set("nav.home", v)} />
          <Field label="Planes" v={get("nav.plans")} on={v => set("nav.plans", v)} />
          <Field label="Nosotros" v={get("nav.about")} on={v => set("nav.about", v)} />
          <Field label="Diferenciadores" v={get("nav.diff")} on={v => set("nav.diff", v)} />
          <Field label="Contacto" v={get("nav.contact")} on={v => set("nav.contact", v)} />
          <Field label="CTA botón" v={get("nav.cta")} on={v => set("nav.cta", v)} />
        </Grid>
      </Section>

      {/* Hero */}
      <Section title="Hero (portada)">
        <Grid>
          <Field label="Badge" v={get("hero.badge")} on={v => set("hero.badge", v)} full />
          <Field label="Título parte 1" v={get("hero.title1")} on={v => set("hero.title1", v)} />
          <Field label="Título parte 2 (itálico)" v={get("hero.title2")} on={v => set("hero.title2", v)} />
          <Field label="Descripción" v={get("hero.desc")} on={v => set("hero.desc", v)} full area />
          <Field label="Botón planes" v={get("hero.ctaPlans")} on={v => set("hero.ctaPlans", v)} />
          <Field label="Botón WhatsApp" v={get("hero.ctaWhats")} on={v => set("hero.ctaWhats", v)} />
        </Grid>
      </Section>

      {/* About */}
      <Section title="Nosotros">
        <Grid>
          <Field label="Kicker" v={get("about.kicker")} on={v => set("about.kicker", v)} />
          <Field label="Título" v={get("about.title")} on={v => set("about.title", v)} />
          <Field label="Cuerpo" v={get("about.body")} on={v => set("about.body", v)} full area />
          <Field label="Título Misión" v={get("about.mission")} on={v => set("about.mission", v)} />
          <Field label="Texto Misión" v={get("about.missionBody")} on={v => set("about.missionBody", v)} area />
          <Field label="Título Visión" v={get("about.vision")} on={v => set("about.vision", v)} />
          <Field label="Texto Visión" v={get("about.visionBody")} on={v => set("about.visionBody", v)} area />
          <Field label="Título Filosofía" v={get("about.philosophy")} on={v => set("about.philosophy", v)} />
          <Field label="Texto Filosofía" v={get("about.philosophyBody")} on={v => set("about.philosophyBody", v)} area />
        </Grid>
      </Section>

      {/* Plans headers */}
      <Section title="Sección Planes (encabezados)">
        <p className="text-xs text-muted-foreground mb-3">Los planes en sí se editan en la pestaña "Planes".</p>
        <Grid>
          <Field label="Kicker" v={get("plans.kicker")} on={v => set("plans.kicker", v)} />
          <Field label="Título" v={get("plans.title")} on={v => set("plans.title", v)} />
          <Field label="Subtítulo" v={get("plans.subtitle")} on={v => set("plans.subtitle", v)} full area />
          <Field label="'Al año'" v={get("plans.perYear")} on={v => set("plans.perYear", v)} />
          <Field label="Etiqueta 'Popular'" v={get("plans.popular")} on={v => set("plans.popular", v)} />
          <Field label="Botón consultar" v={get("plans.consult")} on={v => set("plans.consult", v)} />
          <Field label="Pie de sección" v={get("plans.footnote")} on={v => set("plans.footnote", v)} full />
        </Grid>
      </Section>

      {/* Diff */}
      <Section title="Diferenciadores">
        <Grid>
          <Field label="Kicker" v={get("diff.kicker")} on={v => set("diff.kicker", v)} />
          <Field label="Título" v={get("diff.title")} on={v => set("diff.title", v)} />
          <Field label="Subtítulo" v={get("diff.subtitle")} on={v => set("diff.subtitle", v)} full area />
        </Grid>
        <div className="mt-4 space-y-3">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="rounded-xl border border-border p-4 bg-background/50">
              <p className="text-xs text-muted-foreground mb-2">Ítem {i + 1}</p>
              <Grid>
                <Field label="Título" v={get(`diff.items[${i}].t`)} on={v => set(`diff.items[${i}].t`, v)} />
                <Field label="Descripción" v={get(`diff.items[${i}].d`)} on={v => set(`diff.items[${i}].d`, v)} area />
              </Grid>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contacto">
        <Grid>
          <Field label="Kicker" v={get("contact.kicker")} on={v => set("contact.kicker", v)} />
          <Field label="Título" v={get("contact.title")} on={v => set("contact.title", v)} />
          <Field label="Título Ubicación" v={get("contact.location")} on={v => set("contact.location", v)} />
          <Field label="Dirección línea 1" v={get("contact.address1")} on={v => set("contact.address1", v)} />
          <Field label="Dirección línea 2" v={get("contact.address2")} on={v => set("contact.address2", v)} />
          <Field label="Estacionamiento" v={get("contact.parking")} on={v => set("contact.parking", v)} full />
          <Field label="Título Cómo llegar" v={get("contact.howto")} on={v => set("contact.howto", v)} />
          <Field label="Cómo llegar 1" v={get("contact.howto1")} on={v => set("contact.howto1", v)} />
          <Field label="Cómo llegar 2" v={get("contact.howto2")} on={v => set("contact.howto2", v)} />
          <Field label="Cómo llegar 3" v={get("contact.howto3")} on={v => set("contact.howto3", v)} />
          <Field label="Título Horarios" v={get("contact.hours")} on={v => set("contact.hours", v)} />
          <Field label="Horario 1" v={get("contact.hours1")} on={v => set("contact.hours1", v)} />
          <Field label="Horario 2" v={get("contact.hours2")} on={v => set("contact.hours2", v)} />
          <Field label="Horario 3" v={get("contact.hours3")} on={v => set("contact.hours3", v)} />
          <Field label="Etiqueta WhatsApp" v={get("contact.whats")} on={v => set("contact.whats", v)} />
        </Grid>
      </Section>

      {/* Footer */}
      <Section title="Footer">
        <Grid>
          <Field label="Texto" v={get("footer")} on={v => set("footer", v)} full />
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function Field({ label, v, on, full, area }: { label: string; v: string; on: (v: string) => void; full?: boolean; area?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-xs font-medium mb-1 text-muted-foreground">{label}</span>
      {area ? (
        <textarea rows={3} value={v} onChange={e => on(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      ) : (
        <input value={v} onChange={e => on(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      )}
    </label>
  );
}
