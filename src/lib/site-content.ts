import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";

export type Content = typeof translations["es"];

const CACHE_PREFIX = "site-content:v4:";
const OUT_OF_SCOPE = /(uruguay|uruguai|rivera|binacional|fronteri[zoç]|fronteiri[ço]|frontera|fronteira|ambos pa[ií]ses|dois pa[ií]ses)/i;

const SECTION_COPY = {
  es: {
    nav: { home: "Inicio", about: "El Estudio", plans: "Áreas de Actuación", diff: "Profesionales", contact: "Contacto", cta: "Contacto" },
    aboutKicker: "El Estudio",
    aboutTitle: "El Estudio",
    plansKicker: "Áreas de Actuación",
    diffKicker: "Profesionales",
  },
  pt: {
    nav: { home: "Início", about: "O Escritório", plans: "Áreas de Atuação", diff: "Profissionais", contact: "Contato", cta: "Contato" },
    aboutKicker: "O Escritório",
    aboutTitle: "O Escritório",
    plansKicker: "Áreas de Atuação",
    diffKicker: "Profissionais",
  },
} as const;

const ES_ABOUT = {
  kicker: "El Estudio",
  title: "El Estudio",
  body: "Bouchacourt & Simões Pires Abogacía y Consultoría Jurídica es un estudio multidisciplinario con actuación consultiva, extrajudicial y contenciosa en diferentes áreas. El Derecho de Familia y Sucesiones ocupa un lugar destacado en nuestra práctica, reuniendo la formación especializada de las socias y una experiencia consolidada a lo largo de diez años de actuación continua en el área. Nuestra actuación se basa en el conocimiento técnico, el análisis cuidadoso de cada asunto y la construcción de relaciones profesionales basadas en la confianza, la claridad y la cercanía. Atendemos a personas físicas y empresas, buscando comprender las particularidades de cada situación para ofrecer un acompañamiento jurídico individualizado y responsable.",
} as const;

const PT_ABOUT = {
  kicker: "O Escritório",
  title: "O Escritório",
  body: "Bouchacourt & Simões Pires Advocacia e Consultoria Jurídica é um escritório multidisciplinar com atuação consultiva, extrajudicial e contenciosa em diferentes áreas. O Direito de Família e Sucessões ocupa lugar de destaque em nossa prática, reunindo formação especializada das sócias e experiência consolidada ao longo de dez anos de atuação contínua na área. Nossa atuação é pautada pelo conhecimento técnico, pela análise cuidadosa de cada demanda e pela construção de relações profissionais baseadas em confiança, clareza e proximidade. Atendemos pessoas físicas e empresas, buscando compreender as particularidades de cada situação para oferecer um acompanhamento jurídico individualizado e responsável.",
} as const;

function approvedAbout(lang: Lang) { return lang === "pt" ? PT_ABOUT : ES_ABOUT; }

function cacheKey(lang: Lang) { return `${CACHE_PREFIX}${lang}`; }

function markContentReady(lang: Lang) {
  if (typeof window === "undefined") return;
  (window as any).__BSP_CONTENT_READY__ = lang;
  window.dispatchEvent(new CustomEvent("bsp:content-ready", { detail: { lang } }));
}

function writeCachedContent(lang: Lang, content: Content) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(lang), JSON.stringify(content));
    for (const legacyKey of ["site-content:v1:", "site-content:v2:", "site-content:v3:"]) window.localStorage.removeItem(`${legacyKey}${lang}`);
  } catch {}
}

export function deepMerge(base: any, override: any): any {
  if (override === null || override === undefined) return base;
  if (typeof base !== "object" || typeof override !== "object") return override ?? base;
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  const out: any = { ...base };
  for (const k of Object.keys(override)) {
    const o = override[k];
    if (o === null || o === undefined) continue;
    out[k] = deepMerge(base?.[k], o);
  }
  return out;
}

function removeLegacyBrand(value: any): any {
  if (typeof value === "string") return value.replace(/Vizcaya\s+Salud/gi, "").replace(/Vizcaya/gi, "");
  if (Array.isArray(value)) return value.map(removeLegacyBrand);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, removeLegacyBrand(val)]));
  return value;
}

function stripLegacyDefaults(value: any, oldDefaults: any): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out: any = {};
  for (const [key, item] of Object.entries(value)) {
    const old = oldDefaults?.[key];
    if (typeof item === "string" && typeof old === "string" && item === old) continue;
    out[key] = item && typeof item === "object" && !Array.isArray(item) ? stripLegacyDefaults(item, old) : item;
  }
  return out;
}

function sanitizeWithFallback(value: any, fallback: any): any {
  if (typeof value === "string") return OUT_OF_SCOPE.test(value) && typeof fallback === "string" ? fallback : value;
  if (Array.isArray(value)) return value.map((item, index) => sanitizeWithFallback(item, Array.isArray(fallback) ? fallback[index] : undefined));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeWithFallback(item, fallback?.[key])]));
  return value;
}

function currentBase(lang: Lang) {
  const copy = SECTION_COPY[lang];
  return deepMerge(translations[lang], {
    nav: copy.nav,
    about: { ...approvedAbout(lang), kicker: copy.aboutKicker, title: copy.aboutTitle },
    plans: { kicker: copy.plansKicker },
    diff: { kicker: copy.diffKicker },
    brand: { logoUrl: "/navbar-logo.jpg" },
  });
}

export function resolveSiteContent(lang: Lang, persisted?: any): Content {
  const base = currentBase(lang);
  const cleaned = removeLegacyBrand(persisted ?? {});
  const editablePersisted = stripLegacyDefaults(cleaned, translations[lang]);
  const merged = deepMerge(base, editablePersisted);
  return sanitizeWithFallback(merged, base) as Content;
}

function currentFallback(lang: Lang): Content { return resolveSiteContent(lang); }

function mapEditablePlans(rows: any[], lang: Lang) {
  const safeDefaults = translations[lang].plans.items;
  return rows.map((plan, index) => {
    const mapped = {
      name: lang === "pt" ? plan.name_pt : plan.name_es,
      age: lang === "pt" ? plan.age_pt : plan.age_es,
      price: plan.price ?? "",
      old: plan.old_price ?? "",
      popular: Boolean(plan.popular),
      features: lang === "pt" ? (plan.features_pt ?? []) : (plan.features_es ?? []),
    };
    const searchable = [mapped.name, mapped.age, ...mapped.features].join(" ");
    return OUT_OF_SCOPE.test(searchable) ? (safeDefaults[index] ?? safeDefaults[safeDefaults.length - 1]) : mapped;
  });
}

export function useSiteContent(lang: Lang) {
  const fallback = currentFallback(lang);
  const query = useQuery({
    queryKey: ["site_content", lang, "refresh-safe-v4"],
    queryFn: async () => {
      const [contentResult, plansResult] = await Promise.all([
        supabase.from("site_content").select("data").eq("lang", lang).maybeSingle(),
        supabase.from("plans").select("name_es,name_pt,age_es,age_pt,price,old_price,features_es,features_pt,popular,active,sort_order").eq("active", true).order("sort_order"),
      ]);
      const { data, error } = contentResult;
      if (error || !data?.data) return fallback;
      const baseContent = resolveSiteContent(lang, data.data) as any;
      const content = (!plansResult.error && plansResult.data?.length)
        ? { ...baseContent, plans: { ...baseContent.plans, items: mapEditablePlans(plansResult.data, lang) } }
        : baseContent;
      if (plansResult.error) console.warn("[site plans] No se pudieron cargar los planes editables", plansResult.error);
      const typedContent = content as Content;
      writeCachedContent(lang, typedContent);
      return typedContent;
    },
    placeholderData: fallback,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 2,
  });

  useEffect(() => {
    if (!query.isPlaceholderData && !query.isFetching) markContentReady(lang);
  }, [lang, query.isFetching, query.isPlaceholderData, query.dataUpdatedAt]);

  return query;
}
