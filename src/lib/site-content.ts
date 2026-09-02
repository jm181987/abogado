import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";

export type Content = typeof translations["es"];

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

const HERO_COPY = {
  es: {
    badge: "Estudio jurídico · Sant'Ana do Livramento, RS",
    title1: "Defensa jurídica con",
    title2: "criterio y cercanía",
    desc: "Asesoría jurídica ética y estratégica en Brasil. Acompañamos a personas, familias y empresas con soluciones claras, transparencia y atención profesional en español y portugués.",
    ctaPlans: "Ver áreas de actuación",
    ctaWhats: "WhatsApp",
  },
  pt: {
    badge: "Escritório de advocacia · Sant'Ana do Livramento, RS",
    title1: "Defesa jurídica com",
    title2: "critério e proximidade",
    desc: "Assessoria jurídica ética e estratégica no Brasil. Acompanhamos pessoas, famílias e empresas com soluções claras, transparência e atendimento profissional em português e espanhol.",
    ctaPlans: "Ver áreas de atuação",
    ctaWhats: "WhatsApp",
  },
} as const;

const LANGUAGE_MARKERS = {
  es: /(asesor[ií]a|acompañamos|personas|criterio y cercan[ií]a|defensa jur[ií]dica|estudio jur[ií]dico|atenci[oó]n|actuaci[oó]n|español)/i,
  pt: /(assessoria|acompanhamos|pessoas|crit[eé]rio e proximidade|defesa jur[ií]dica|escrit[oó]rio de advocacia|atendimento|atuaç[aã]o|portugu[eê]s)/i,
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

const CONTACT_COPY = {
  es: {
    kicker: "Contacto",
    title: "Estamos para orientarte",
    location: "Ubicación",
    address1: "Rua Uruguai, 1248 · Sala 2",
    address2: "Sant'Ana do Livramento, RS",
    parking: "",
    howto: "Cómo llegar",
    howto1: "Sant'Ana do Livramento, RS",
    howto2: "Rio Grande do Sul · Brasil",
    howto3: "Atención presencial en Sala 2",
    hours: "Horarios",
    hours1: "Lunes a viernes: 9:00 – 18:00",
    hours2: "Sábados: 9:00 – 12:00 (con cita)",
    hours3: "Urgencias fuera de horario por WhatsApp",
    whats: "WhatsApp",
  },
  pt: {
    kicker: "Contato",
    title: "Estamos à disposição para orientar você",
    location: "Endereço",
    address1: "Rua Uruguai, 1248 · Sala 2",
    address2: "Sant'Ana do Livramento, RS",
    parking: "",
    howto: "Como chegar",
    howto1: "Sant'Ana do Livramento, RS",
    howto2: "Rio Grande do Sul · Brasil",
    howto3: "Atendimento presencial na Sala 2",
    hours: "Horários",
    hours1: "Segunda a sexta: 9:00 – 18:00",
    hours2: "Sábados: 9:00 – 12:00 (com hora marcada)",
    hours3: "Urgências fora do horário via WhatsApp",
    whats: "WhatsApp",
  },
} as const;

function approvedHero(lang: Lang) { return lang === "pt" ? HERO_COPY.pt : HERO_COPY.es; }
function approvedAbout(lang: Lang) { return lang === "pt" ? PT_ABOUT : ES_ABOUT; }
function approvedContact(lang: Lang) { return lang === "pt" ? CONTACT_COPY.pt : CONTACT_COPY.es; }

function markContentReady(lang: Lang) {
  if (typeof window === "undefined") return;
  (window as any).__BSP_CONTENT_READY__ = lang;
  window.dispatchEvent(new CustomEvent("bsp:content-ready", { detail: { lang } }));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Mezcla únicamente valores compatibles con la forma del contenido base.
 * Un registro viejo o mal formado de site_content nunca puede sustituir un
 * objeto por texto, una lista por un objeto, etc. Eso evita errores de render
 * al llegar datos persistidos después de la hidratación.
 */
export function deepMerge(base: any, override: any): any {
  if (override === null || override === undefined) return base;
  if (base === null || base === undefined) return override;

  const baseIsArray = Array.isArray(base);
  const overrideIsArray = Array.isArray(override);
  if (baseIsArray || overrideIsArray) {
    return baseIsArray && overrideIsArray ? override : base;
  }

  const baseIsObject = isPlainObject(base);
  const overrideIsObject = isPlainObject(override);
  if (baseIsObject || overrideIsObject) {
    if (!baseIsObject || !overrideIsObject) return base;
    const out: any = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (value === null || value === undefined) continue;
      out[key] = key in base ? deepMerge(base[key], value) : value;
    }
    return out;
  }

  return typeof base === typeof override ? override : base;
}

function removeLegacyBrand(value: any): any {
  if (typeof value === "string") return value.replace(/Vizcaya\s+Salud/gi, "").replace(/Vizcaya/gi, "");
  if (Array.isArray(value)) return value.map(removeLegacyBrand);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, removeLegacyBrand(val)]));
  return value;
}

function stripLegacyDefaults(value: any, oldDefaults: any): any {
  if (!isPlainObject(value)) return value;
  const out: any = {};
  for (const [key, item] of Object.entries(value)) {
    const old = oldDefaults?.[key];
    if (typeof item === "string" && typeof old === "string" && item === old) continue;
    out[key] = isPlainObject(item) ? stripLegacyDefaults(item, old) : item;
  }
  return out;
}

function sanitizeWithFallback(value: any, fallback: any): any {
  if (fallback !== undefined && fallback !== null) {
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
    if (isPlainObject(fallback) && !isPlainObject(value)) return fallback;
    if (!Array.isArray(fallback) && !isPlainObject(fallback) && typeof value !== typeof fallback) return fallback;
  }

  if (typeof value === "string") return OUT_OF_SCOPE.test(value) && typeof fallback === "string" ? fallback : value;
  if (Array.isArray(value)) {
    const fallbackItem = Array.isArray(fallback) ? fallback[0] : undefined;
    return value.map((item, index) => sanitizeWithFallback(item, Array.isArray(fallback) ? (fallback[index] ?? fallbackItem) : undefined));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeWithFallback(item, fallback?.[key])]));
  }
  return value;
}

function sanitizeLocalizedSection(value: any, fallback: any, lang: Lang): any {
  if (isPlainObject(fallback) && !isPlainObject(value)) return fallback;
  if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;

  const opposite = lang === "pt" ? LANGUAGE_MARKERS.es : LANGUAGE_MARKERS.pt;
  if (typeof value === "string") {
    if (opposite.test(value) && typeof fallback === "string") return fallback;
    return value;
  }
  if (Array.isArray(value)) {
    const fallbackItem = Array.isArray(fallback) ? fallback[0] : undefined;
    return value.map((item, index) => sanitizeLocalizedSection(item, Array.isArray(fallback) ? (fallback[index] ?? fallbackItem) : undefined, lang));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeLocalizedSection(item, fallback?.[key], lang)]));
  }
  return fallback ?? value;
}

function currentBase(lang: Lang) {
  const copy = SECTION_COPY[lang];
  return deepMerge(translations[lang], {
    nav: copy.nav,
    hero: approvedHero(lang),
    about: { ...approvedAbout(lang), kicker: copy.aboutKicker, title: copy.aboutTitle },
    plans: { kicker: copy.plansKicker },
    diff: { kicker: copy.diffKicker },
    contact: approvedContact(lang),
    brand: { logoUrl: "/navbar-logo.jpg" },
  });
}

export function resolveSiteContent(lang: Lang, persisted?: any): Content {
  const base = currentBase(lang);
  if (!isPlainObject(persisted)) return base as Content;

  const cleaned = removeLegacyBrand(persisted);
  const editablePersisted = stripLegacyDefaults(cleaned, translations[lang]);
  const merged = deepMerge(base, editablePersisted);
  const localized = {
    ...merged,
    nav: SECTION_COPY[lang].nav,
    hero: sanitizeLocalizedSection(merged.hero, approvedHero(lang), lang),
    diff: sanitizeLocalizedSection(merged.diff, base.diff, lang),
    contact: approvedContact(lang),
  };
  return sanitizeWithFallback(localized, base) as Content;
}

function currentFallback(lang: Lang): Content { return resolveSiteContent(lang); }

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapEditablePlans(rows: any[], lang: Lang) {
  const safeDefaults = translations[lang].plans.items;
  return rows.map((plan, index) => {
    const safeDefault = safeDefaults[index] ?? safeDefaults[safeDefaults.length - 1];
    const features = asStringArray(lang === "pt" ? plan?.features_pt : plan?.features_es);
    const mapped = {
      name: typeof (lang === "pt" ? plan?.name_pt : plan?.name_es) === "string" ? (lang === "pt" ? plan.name_pt : plan.name_es) : safeDefault.name,
      age: typeof (lang === "pt" ? plan?.age_pt : plan?.age_es) === "string" ? (lang === "pt" ? plan.age_pt : plan.age_es) : safeDefault.age,
      price: typeof plan?.price === "string" ? plan.price : (safeDefault.price ?? ""),
      old: typeof plan?.old_price === "string" ? plan.old_price : (safeDefault.old ?? ""),
      popular: Boolean(plan?.popular),
      features: features.length ? features : asStringArray(safeDefault.features),
    };
    const searchable = [mapped.name, mapped.age, ...mapped.features].join(" ");
    return OUT_OF_SCOPE.test(searchable) ? safeDefault : mapped;
  });
}

export function useSiteContent(lang: Lang) {
  const fallback = currentFallback(lang);
  const query = useQuery({
    queryKey: ["site_content", lang, "db-safe-v6"],
    queryFn: async () => {
      try {
        const [contentResult, plansResult] = await Promise.all([
          supabase.from("site_content").select("data").eq("lang", lang).maybeSingle(),
          supabase.from("plans").select("name_es,name_pt,age_es,age_pt,price,old_price,features_es,features_pt,popular,active,sort_order").eq("active", true).order("sort_order"),
        ]);

        const { data, error } = contentResult;
        const baseContent = !error && isPlainObject(data?.data)
          ? (resolveSiteContent(lang, data.data) as any)
          : (fallback as any);

        const content = (!plansResult.error && Array.isArray(plansResult.data) && plansResult.data.length)
          ? { ...baseContent, plans: { ...baseContent.plans, items: mapEditablePlans(plansResult.data, lang) } }
          : baseContent;

        if (error) console.warn("[site content] Se ignoró contenido persistido inválido o inaccesible", error);
        if (plansResult.error) console.warn("[site plans] No se pudieron cargar los planes editables", plansResult.error);

        return sanitizeWithFallback(content, fallback) as Content;
      } catch (error) {
        console.warn("[site content] Se usa contenido estable porque la BD no respondió correctamente", error);
        return fallback;
      }
    },
    placeholderData: fallback,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  useEffect(() => {
    if (!query.isPlaceholderData && !query.isFetching) markContentReady(lang);
  }, [lang, query.isFetching, query.isPlaceholderData, query.dataUpdatedAt]);

  return query;
}
