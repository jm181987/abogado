import { useEffect, useState, type ReactNode } from "react";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";

export function SiteContentGate({ children }: { children: ReactNode }) {
  // Mantener el primer render idéntico en SSR y cliente: el visitante ve únicamente
  // la identidad del estudio mientras React hidrata y terminan de cargar los recursos
  // esenciales. Cuando la página está lista, revelamos el contenido de una sola vez.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    const reveal = () => {
      if (cancelled) return;
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (!cancelled) setReady(true);
        });
      });
    };

    if (document.readyState === "complete") {
      reveal();
    } else {
      window.addEventListener("load", reveal, { once: true });
    }

    // No permitir que una fuente o recurso externo lento mantenga la pantalla de
    // carga indefinidamente si el documento ya se puede utilizar.
    const safetyTimer = window.setTimeout(reveal, 4000);

    return () => {
      cancelled = true;
      window.removeEventListener("load", reveal);
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
          transition: "opacity 180ms ease",
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
