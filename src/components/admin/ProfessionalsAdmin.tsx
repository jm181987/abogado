import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

type Professional = {
  name: string;
  role: string;
  credential: string;
  bio: string;
  photo: string;
};

type ProfessionalsData = {
  title: string;
  subtitle: string;
  items: Professional[];
};

const DEFAULTS: Record<Lang, ProfessionalsData> = {
  pt: {
    title: "Quem está à frente do escritório",
    subtitle: "Conheça os profissionais responsáveis pela condução técnica e próxima de cada atendimento.",
    items: [
      { name: "Daniele Dachi Simões Pires", role: "Advogada", credential: "OAB/RS 108.350", bio: "Atuação jurídica pautada pelo rigor técnico, clareza e acompanhamento individualizado de cada demanda.", photo: "" },
      { name: "Macarena de La Rosa Bouchacourt", role: "Advogada", credential: "OAB/RS 106.130", bio: "Atuação jurídica orientada pela análise cuidadosa, proximidade com o cliente e condução responsável de cada caso.", photo: "" },
      { name: "Matheus Figueiredo Machado", role: "Advogado", credential: "OAB/RS 127.152", bio: "Advogado, formado pelo Centro Universitário da Região da Campanha — URCAMP. Pós-graduado em Direito Penal e Processual Penal pela Legale Educacional e com especialização em Direito Processual Penal pela Universidade Paulista — UNIP.", photo: "" },
    ],
  },
  es: {
    title: "Quiénes están al frente del estudio",
    subtitle: "Conoce a los profesionales responsables de una atención técnica, cercana y cuidadosa en cada asunto.",
    items: [
      { name: "Daniele Dachi Simões Pires", role: "Abogada", credential: "OAB/RS 108.350", bio: "Actuación jurídica basada en el rigor técnico, la claridad y el acompañamiento individualizado de cada asunto.", photo: "" },
      { name: "Macarena de La Rosa Bouchacourt", role: "Abogada", credential: "OAB/RS 106.130", bio: "Actuación jurídica orientada por el análisis cuidadoso, la cercanía con el cliente y la conducción responsable de cada caso.", photo: "" },
      { name: "Matheus Figueiredo Machado", role: "Abogado", credential: "OAB/RS 127.152", bio: "Abogado graduado por el Centro Universitario de la Región de Campanha — URCAMP. Posgraduado en Derecho Penal y Procesal Penal por Legale Educacional y con especialización en Derecho Procesal Penal por la Universidade Paulista — UNIP.", photo: "" },
    ],
  },
};

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

function resolveData(lang: Lang, raw: any): ProfessionalsData {
  const fallback = clone(DEFAULTS[lang]);
  const incoming = raw?.professionals ?? {};
  return {
    title: incoming.title || fallback.title,
    subtitle: incoming.subtitle || fallback.subtitle,
    items: fallback.items.map((item, index) => ({ ...item, ...(incoming.items?.[index] ?? {}) })),
  };
}

export function ProfessionalsAdmin({ lang }: { lang: Lang }) {
  const [data, setData] = useState<ProfessionalsData>(() => clone(DEFAULTS[lang]));
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  async function load() {
    setLoading(true);
    const [{ data: rows, error }, { data: photoRows, error: photosError }] = await Promise.all([
      supabase.from("site_content").select("lang,data").in("lang", ["es", "pt"]),
      supabase.from("site_photos").select("storage_path").order("updated_at", { ascending: false }),
    ]);
    if (error) {
      alert(ui(lang, "No se pudieron cargar los profesionales: ", "Não foi possível carregar os profissionais: ") + error.message);
      setLoading(false);
      return;
    }
    if (photosError) console.warn("[professionals photos]", photosError);
    const current = rows?.find((row: any) => row.lang === lang)?.data ?? {};
    setData(resolveData(lang, current));

    const uploadedPhotos = (photoRows ?? []).map((row: any) => supabase.storage.from("site-photos").getPublicUrl(row.storage_path).data.publicUrl).filter(Boolean);
    const legacyGallery = (rows ?? []).flatMap((row: any) => Array.isArray(row.data?.media?.gallery) ? row.data.media.gallery : []);
    setGallery(Array.from(new Set([...uploadedPhotos, ...legacyGallery].filter(Boolean))));
    setLoading(false);
  }

  useEffect(() => { void load(); }, [lang]);

  const selectedPhotos = useMemo(() => new Set(data.items.map(item => item.photo).filter(Boolean)), [data.items]);

  function updateItem(index: number, patch: Partial<Professional>) {
    setData(prev => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  }

  async function save() {
    setSaving(true); setSaved(false);
    const { data: rows, error: loadError } = await supabase.from("site_content").select("lang,data").in("lang", ["es", "pt"]);
    if (loadError) { alert(loadError.message); setSaving(false); return; }

    const otherLang: Lang = lang === "pt" ? "es" : "pt";
    const currentRow: any = rows?.find((row: any) => row.lang === lang)?.data ?? {};
    const otherRow: any = rows?.find((row: any) => row.lang === otherLang)?.data ?? {};
    const otherProfessionals = resolveData(otherLang, otherRow);

    const sharedItems = data.items.map((item, index) => ({
      ...otherProfessionals.items[index],
      name: item.name,
      credential: item.credential,
      photo: item.photo,
    }));

    const updates = [
      { lang, data: { ...currentRow, professionals: data }, updated_at: new Date().toISOString() },
      { lang: otherLang, data: { ...otherRow, professionals: { ...otherProfessionals, items: sharedItems } }, updated_at: new Date().toISOString() },
    ];

    const { error } = await supabase.from("site_content").upsert(updates as any, { onConflict: "lang" });
    setSaving(false);
    if (error) { alert(ui(lang, "Error guardando: ", "Erro ao salvar: ") + error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  if (loading) return <p className="text-sm text-muted-foreground">{ui(lang, "Cargando profesionales…", "Carregando profissionais…")}</p>;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{ui(lang, "Profesionales", "Profissionais")}</p>
          <h2 className="mt-1 font-display text-2xl">{ui(lang, "Quiénes están al frente del estudio", "Quem está à frente do escritório")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{ui(lang, "Edita el contenido del idioma seleccionado. Nombre, OAB y foto se mantienen sincronizados entre ES/PT.", "Edite o conteúdo do idioma selecionado. Nome, OAB e foto ficam sincronizados entre PT/ES.")}</p>
        </div>
        <button onClick={save} disabled={saving} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {saving ? ui(lang, "Guardando…", "Salvando…") : saved ? `✓ ${ui(lang, "Guardado", "Salvo")}` : ui(lang, "Guardar profesionales", "Salvar profissionais")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground sm:col-span-2">{ui(lang, "Título de sección", "Título da seção")}<input value={data.title} onChange={e => setData(prev => ({ ...prev, title: e.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
        <label className="text-xs text-muted-foreground sm:col-span-2">{ui(lang, "Introducción", "Introdução")}<textarea value={data.subtitle} onChange={e => setData(prev => ({ ...prev, subtitle: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {data.items.map((item, index) => (
          <div key={index} className={`rounded-2xl border border-border bg-background/60 p-4 sm:p-5 ${data.items.length % 2 === 1 && index === data.items.length - 1 ? "lg:col-span-2 lg:max-w-3xl lg:justify-self-center" : ""}`}>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <div className="overflow-hidden rounded-xl border border-border bg-muted aspect-[4/5]">
                {item.photo ? <img src={item.photo} alt={item.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center px-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground">{ui(lang, "Sin foto", "Sem foto")}</div>}
              </div>
              <div className="space-y-3">
                <input value={item.name} onChange={e => updateItem(index, { name: e.target.value })} className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" placeholder={ui(lang, "Nombre", "Nome")} />
                <div className="grid gap-2 sm:grid-cols-2"><input value={item.role} onChange={e => updateItem(index, { role: e.target.value })} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" placeholder={ui(lang, "Cargo", "Cargo")} /><input value={item.credential} onChange={e => updateItem(index, { credential: e.target.value })} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" placeholder="OAB/RS" /></div>
                <textarea value={item.bio} onChange={e => updateItem(index, { bio: e.target.value })} rows={7} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder={ui(lang, "Biografía", "Biografia")} />
                {item.photo && <button type="button" onClick={() => updateItem(index, { photo: "" })} className="text-xs font-semibold text-destructive underline">{ui(lang, "Quitar foto", "Remover foto")}</button>}
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{ui(lang, "Usar foto de la biblioteca", "Usar foto da biblioteca")}</p>
              {gallery.length ? (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {gallery.map(url => (
                    <button key={url} type="button" onClick={() => updateItem(index, { photo: url })} className={`relative overflow-hidden rounded-lg border aspect-square ${item.photo === url ? "border-primary ring-2 ring-primary/25" : "border-border"}`}>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {selectedPhotos.has(url) && item.photo !== url && <span className="absolute inset-0 bg-background/45" />}
                    </button>
                  ))}
                </div>
              ) : <p className="mt-2 text-xs text-muted-foreground">{ui(lang, "Aún no hay fotos en la biblioteca. Súbelas desde la pestaña Fotos.", "Ainda não há fotos na biblioteca. Envie-as pela aba Fotos.")}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
