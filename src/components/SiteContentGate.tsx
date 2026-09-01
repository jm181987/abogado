import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { HomeLanguageSync } from "@/components/HomeLanguageSync";

const LEGACY_CONTENT_PREFIXES = [
  "site-content:v1:",
  "site-content:v2:",
  "site-content:v3:",
  "site-content:v4:",
];

function expectedLanguage(): "es" | "pt" {
  try {
    const saved = localStorage.getItem("abogado-language");
    if (saved === "es" || saved === "pt") return saved;
  } catch {}

  try {
    const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    return candidates.some((value) => value.toLowerCase().startsWith("pt")) ? "pt" : "es";
  } catch {
    return "es";
  }
}

async function purgeLegacyBrowserState() {
  try {
    for (const prefix of LEGACY_CONTENT_PREFIXES) {
      localStorage.removeItem(`${prefix}es`);
      localStorage.removeItem(`${prefix}pt`);
    }
  } catch {}

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {}

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {}
}

export function SiteContentGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setReady(true);
      return;
    }

    let cancelled = false;
    const expected = expectedLanguage();
    const reveal = () => { if (!cancelled) setReady(true); };
    const onContentReady = (event: Event) => {
      const lang = (event as CustomEvent<{ lang?: string }>).detail?.lang;
      if (lang === expected) reveal();
    };

    window.addEventListener("bsp:content-ready", onContentReady);
    void purgeLegacyBrowserState().then(() => {
      if ((window as any).__BSP_CONTENT_READY__ === expected) reveal();
    });
    const safetyTimer = window.setTimeout(reveal, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      window.removeEventListener("bsp:content-ready", onContentReady);
    };
  }, [pathname]);

  if (pathname !== "/") return <>{children}</>;

  return (
    <>
      <HomeLanguageSync />
      <div aria-hidden={!ready} style={{ opacity: ready ? 1 : 0 }}>{children}</div>
      {!ready && (
        <div aria-label="Cargando sitio" className="fixed inset-0 z-[9999] grid place-items-center bg-background">
          <img src="/navbar-logo.jpg" alt="Bouchacourt & Simões Pires Advocacia" className="h-auto w-[min(78vw,360px)] object-contain" />
        </div>
      )}
    </>
  );
}
