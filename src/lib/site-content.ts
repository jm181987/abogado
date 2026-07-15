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

export function useSiteContent(lang: Lang) {
  return useQuery({
    queryKey: ["site_content", lang],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("data")
        .eq("lang", lang)
        .maybeSingle();
      return deepMerge(translations[lang], data?.data ?? {}) as Content;
    },
    staleTime: 30_000,
  });
}
