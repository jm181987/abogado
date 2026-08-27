import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const STORAGE_KEY = "abogado-language";

export function detectDeviceLanguage(): Lang {
  if (typeof navigator === "undefined") return "es";
  const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  return candidates.some((value) => value.toLowerCase().startsWith("pt")) ? "pt" : "es";
}

export function readPreferredLanguage(): Lang {
  if (typeof window === "undefined") return "es";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "pt") return saved;
  return detectDeviceLanguage();
}

export function usePreferredLanguage() {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const initial = readPreferredLanguage();
    setLangState(initial);
    document.documentElement.lang = initial === "pt" ? "pt-BR" : "es";
  }, []);

  const setLang = useCallback((next: Lang, persist = true) => {
    setLangState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "pt" ? "pt-BR" : "es";
    }
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { lang, setLang };
}
