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
  // El contenido permanece totalmente oculto hasta que tanto los textos de
  // Supabase como la imagen real del hero estén listos para el idioma esperado.
  // El cambio loader -> sitio ocurre en un único commit, sin fundido intermedio.
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

    // Rutas como /admin no tienen HeroMedia ni contenido público que sincronizar.
    if (window.location.pathname !== "/") {
      reveal();
      return () => {
        cancelled = true;
        if (firstFrame) window.cancelAnimationFrame(firstFrame);
        if (secondFrame) window.cancelAnimationFrame(secondFrame);
      };
    }

    let heroReady = (window as any).__BSP_HERO_READY__ === expected;
    let contentReady = (window as any).__BSP_CONTENT_READY__ === expected;

    const maybeReveal = () => {
      if (heroReady && contentReady) reveal();
    };

    const onHeroReady = (event: Event) => {
      const lang = (event as CustomEvent<{ lang?: string }>).detail?.lang;
      if (lang !== expected) return;
      heroReady = true;
      maybeReveal();
    };

    const onContentReady = (event: Event) => {
      const lang = (event as CustomEvent<{ lang?: string }>).detail?.lang;
      if (lang !== expected) return;
      contentReady = true;
      maybeReveal();
    };

    window.addEventListener("bsp:hero-ready", onHeroReady as EventListener);
    window.addEventListener("bsp:content-ready", onContentReady as EventListener);
    maybeReveal();

    // Evita un bloqueo permanente ante un fallo extremo de red. En el flujo
    // normal ambos eventos llegan antes y nunca se muestra contenido transitorio.
    const safetyTimer = window.setTimeout(reveal, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("bsp:hero-ready", onHeroReady as EventListener);
      window.removeEventListener("bsp:content-ready", onContentReady as EventListener);
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
          visibility: ready ? "visible" : "hidden",
          pointerEvents: ready ? "auto" : "none",
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
