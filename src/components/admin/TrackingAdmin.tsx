import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

type TrackingConfig = {
  analyticsEnabled: boolean;
  googleAnalyticsId: string;
  metaPixelEnabled: boolean;
  metaPixelId: string;
};

const DEFAULTS: TrackingConfig = {
  analyticsEnabled: false,
  googleAnalyticsId: "",
  metaPixelEnabled: false,
  metaPixelId: "",
};

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

export function TrackingAdmin({ lang }: { lang: Lang }) {
  const [data, setData] = useState<TrackingConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data: row, error } = await supabase.from("site_content").select("data").eq("lang", "pt").maybeSingle();
      if (error) alert(ui(lang, "No se pudo cargar la configuración: ", "Não foi possível carregar a configuração: ") + error.message);
      setData({ ...DEFAULTS, ...(((row?.data as any)?.tracking ?? {}) as Partial<TrackingConfig>) });
      setLoading(false);
    })();
  }, [lang]);

  async function save() {
    const ga = data.googleAnalyticsId.trim();
    const pixel = data.metaPixelId.trim();
    if (data.analyticsEnabled && ga && !/^G-[A-Z0-9]+$/i.test(ga)) {
      alert(ui(lang, "El ID de Google Analytics debe tener formato G-XXXXXXXXXX.", "O ID do Google Analytics deve ter o formato G-XXXXXXXXXX."));
      return;
    }
    if (data.metaPixelEnabled && pixel && !/^\d{5,30}$/.test(pixel)) {
      alert(ui(lang, "El ID de Meta Pixel debe ser numérico.", "O ID do Meta Pixel deve ser numérico."));
      return;
    }

    setSaving(true); setSaved(false);
    const { data: rows, error: readError } = await supabase.from("site_content").select("lang,data").in("lang", ["es", "pt"]);
    if (readError) { alert(readError.message); setSaving(false); return; }
    const tracking = { ...data, googleAnalyticsId: ga, metaPixelId: pixel };
    const updates = (["es", "pt"] as const).map(contentLang => {
      const current = (rows ?? []).find((row: any) => row.lang === contentLang)?.data ?? {};
      return { lang: contentLang, data: { ...current, tracking }, updated_at: new Date().toISOString() };
    });
    const { error } = await supabase.from("site_content").upsert(updates as any, { onConflict: "lang" });
    setSaving(false);
    if (error) { alert(ui(lang, "Error guardando: ", "Erro ao salvar: ") + error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  if (loading) return <p className="text-sm text-muted-foreground">{ui(lang, "Cargando medición…", "Carregando medição…")}</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Analytics & Pixel</p>
        <h2 className="mt-1 font-display text-2xl">{ui(lang, "Gestor de medición", "Gerenciador de medição")}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{ui(lang, "Configura Google Analytics 4 y Meta Pixel. Los scripts solo se cargan cuando el visitante acepta cookies de análisis/publicidad.", "Configure Google Analytics 4 e Meta Pixel. Os scripts só são carregados quando o visitante aceita cookies de análise/publicidade.")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="font-display text-xl">Google Analytics 4</h3><p className="mt-1 text-xs text-muted-foreground">Measurement ID</p></div>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={data.analyticsEnabled} onChange={e => setData(prev => ({ ...prev, analyticsEnabled: e.target.checked }))} />{ui(lang, "Activo", "Ativo")}</label>
          </div>
          <input value={data.googleAnalyticsId} onChange={e => setData(prev => ({ ...prev, googleAnalyticsId: e.target.value }))} placeholder="G-XXXXXXXXXX" className="mt-5 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{ui(lang, "Se cargará gtag.js y se registrarán páginas vistas una vez otorgado el consentimiento.", "O gtag.js será carregado e as visualizações de página serão registradas após o consentimento.")}</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="font-display text-xl">Meta Pixel</h3><p className="mt-1 text-xs text-muted-foreground">Pixel ID</p></div>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={data.metaPixelEnabled} onChange={e => setData(prev => ({ ...prev, metaPixelEnabled: e.target.checked }))} />{ui(lang, "Activo", "Ativo")}</label>
          </div>
          <input value={data.metaPixelId} onChange={e => setData(prev => ({ ...prev, metaPixelId: e.target.value.replace(/\D/g, "") }))} placeholder="123456789012345" inputMode="numeric" className="mt-5 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{ui(lang, "Se enviará el evento PageView después de que el visitante acepte las cookies opcionales.", "O evento PageView será enviado depois que o visitante aceitar os cookies opcionais.")}</p>
        </section>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? ui(lang, "Guardando…", "Salvando…") : saved ? `✓ ${ui(lang, "Guardado", "Salvo")}` : ui(lang, "Guardar configuración", "Salvar configuração")}</button>
      </div>
    </div>
  );
}
