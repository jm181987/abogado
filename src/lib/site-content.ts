import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translations, type Lang } from "@/lib/i18n";

export type Content = typeof translations["es"];

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
// the old brand after a refresh. Sanitize all persisted text before merging.
function removeLegacyBrand(value: any): any {
  if (typeof value === "string") {
    return value
      .replace(/Vizcaya\s+Salud/gi, "Estudio Jurídico")
      .replace(/Vizcaya/gi, "Estudio Jurídico");
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
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("lang", lang)
        .maybeSingle();
      const persisted = removeLegacyBrand(data?.data ?? {});
      return deepMerge(translations[lang], persisted) as Content;
    },
    staleTime: 30_000,
  });
}
