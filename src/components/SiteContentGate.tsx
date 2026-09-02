import { useEffect, type ReactNode } from "react";
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

export function SiteContentGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname !== "/") return;
    // La limpieza de estado antiguo es mantenimiento en segundo plano y nunca
    // debe bloquear ni ocultar el HTML que ya entregó el servidor.
    void purgeLegacyBrowserState();
  }, [pathname]);

  if (pathname !== "/") return <>{children}</>;

  // Fail-open: el contenido SSR siempre queda visible. Si una integración del
  // cliente tarda o falla durante la hidratación, el visitante sigue viendo y
  // puede leer la página en lugar de quedar atrapado en una pantalla de carga.
  return (
    <>
      <HomeLanguageSync />
      <ProfessionalContacts />
      {children}
    </>
  );
}
