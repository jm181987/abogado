import { useEffect, useState, type ReactNode } from "react";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";

function expectedLanguage(): "es" | "pt" {
  try {
    const saved = window.localStorage.getItem("abogado-language");
    if (saved === "es" || saved === "pt") return saved;
  } catch {}

  try {
    const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    return candidates.some((value) => value.toLowerCase().startsWith("pt")) ? "pt" : "es";
  } catch {
    return "es";
  }
}

export function SiteContentGate({ children }: { children: ReactNode }) {
  // El logo cubre toda la fase inicial y el sitio solo se revela cuando la imagen
  // real del hero correspondiente al idioma del visitante ya terminó de cargar.
  // Así nunca queda visible durante milisegundos la imagen fallback del bundle.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    const expected = expectedLanguage();

    const reveal = () => {
      if (cancelled) return;
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (!cancelled) setReady(true);
        });
      });
    };

    // Rutas como /admin no tienen HeroMedia y no deben esperar un evento del hero.
    if (window.location.pathname !== "/") {
      reveal();
      return () => {
        cancelled = true;
        if (firstFrame) window.cancelAnimationFrame(firstFrame);
        if (secondFrame) window.cancelAnimationFrame(secondFrame);
      };
    }

    const onHeroReady = (event: Event) => {
      const lang = (event as CustomEvent<{ lang?: string }>).detail?.lang;
      if (lang === expected) reveal();
    };

    window.addEventListener("bsp:hero-ready", onHeroReady as EventListener);

    if ((window as any).__BSP_HERO_READY__ === expected) reveal();

    // Solo para un fallo extremo de red/imagen: evita bloquear el sitio para siempre.
    // En el flujo normal el evento del hero ocurre mucho antes y el fallback nunca se ve.
    const safetyTimer = window.setTimeout(reveal, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("bsp:hero-ready", onHeroReady as EventListener);
      window.clearTimeout(safetyTimer);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden={!ready}
        data-bsp-site-content="true"
        style={{
          opacity: ready ? 1 : 0,
          pointerEvents: ready ? "auto" : "none",
          transition: "opacity 120ms ease",
        }}
      >
        <ProfessionalContacts />
        {children}
      </div>

      {!ready && (
        <div
          data-bsp-site-loader="true"
          aria-label="Cargando sitio"
          role="status"
          className="fixed inset-0 z-[9999] grid place-items-center bg-background"
        >
          <img
            src="/navbar-logo.jpg"
            alt="Bouchacourt & Simões Pires Advocacia"
            className="h-auto w-[min(78vw,360px)] object-contain"
            loading="eager"
            decoding="sync"
          />
        </div>
      )}
    </>
  );
}
