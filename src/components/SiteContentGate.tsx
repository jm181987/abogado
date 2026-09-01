import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";
import { HomeLanguageSync } from "@/components/HomeLanguageSync";

const LEGACY_CONTENT_PREFIXES = [
  "site-content:v1:",
  "site-content:v2:",
  "site-content:v3:",
  "site-content:v4:",
];

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

/**
 * Mantiene cubierta la primera pintura del homepage hasta que React haya
 * hidratado la versión actual. Esto evita que HTML/JS almacenado por el
 * navegador o una antigua service worker pueda verse durante un refresh.
 */
export function SiteContentGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setReady(true);
      return;
    }

    let cancelled = false;
    let frame1 = 0;
    let frame2 = 0;

    void purgeLegacyBrowserState().finally(() => {
      frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          if (!cancelled) setReady(true);
        });
      });
    });

    return () => {
      cancelled = true;
      if (frame1) cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
    };
  }, [pathname]);

  if (pathname !== "/") return <>{children}</>;

  return (
    <>
      <HomeLanguageSync />
      <ProfessionalContacts />
      <div aria-hidden={!ready} style={{ opacity: ready ? 1 : 0, transition: "opacity 120ms ease" }}>
        {children}
      </div>
      {!ready && (
        <div
          aria-label="Cargando sitio"
          className="fixed inset-0 z-[9999] grid place-items-center bg-background"
        >
          <img
            src="/navbar-logo.jpg"
            alt="Bouchacourt & Simões Pires Advocacia"
            className="h-auto w-[min(78vw,360px)] object-contain"
          />
        </div>
      )}
    </>
  );
}
