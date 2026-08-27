import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";

export type Content = typeof translations["es"];

const CACHE_PREFIX = "site-content:v1:";

function cacheKey(lang: Lang) {
  return `${CACHE_PREFIX}${lang}`;
}

function readCachedContent(lang: Lang): Content | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(cacheKey(lang));
    return raw ? (JSON.parse(raw) as Content) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedContent(lang: Lang, content: Content) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(lang), JSON.stringify(content));
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

export function deepMerge(base: any, override: any): any {
  if (override === null || override === undefined) return base;
  if (typeof base !== "object" || typeof override !== "object") return override ?? base;
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  const out: any = { ...base };
  for (const k of Object.keys(override)) {
    const o = override[k];
    if (o === null || o === undefined || o === "") continue;
    out[k] = deepMerge(base?.[k], o);
  }
  return out;
}

// Legacy content from the previous site must never be able to reintroduce
// the old brand after a refresh. Sanitize persisted text before merging.
function removeLegacyBrand(value: any): any {
  if (typeof value === "string") {
    return value
      .replace(/Vizcaya\s+Salud/gi, "")
      .replace(/Vizcaya/gi, "");
  }
  if (Array.isArray(value)) return value.map(removeLegacyBrand);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, removeLegacyBrand(val)]));
  }
  return value;
}

export function useSiteContent(lang: Lang) {
  return useQuery({
    queryKey: ["site_content", lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("data")
        .eq("lang", lang)
        .maybeSingle();

      if (error) {
        const cached = readCachedContent(lang);
        if (cached) return cached;
        throw new Error(`No se pudo cargar el contenido del sitio: ${error.message}`);
      }

      if (!data?.data) {
        const cached = readCachedContent(lang);
        if (cached) return cached;
        throw new Error("El contenido publicado del sitio no está disponible.");
      }

      const persisted = removeLegacyBrand(data.data);
      const content = deepMerge(translations[lang], persisted) as Content;
      writeCachedContent(lang, content);
      return content;
    },
    placeholderData: (previousData) => previousData ?? readCachedContent(lang),
    staleTime: 30_000,
    retry: 2,
  });
}
