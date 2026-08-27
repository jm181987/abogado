import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";
import { HomeLanguageSync } from "@/components/HomeLanguageSync";

/**
 * El homepage ya dispone de contenido local completo y cada sección obtiene
 * el contenido publicado en segundo plano. Evitamos bloquear el primer render
 * esperando una consulta de red: la página aparece de inmediato y los datos
 * editables se actualizan cuando llegan.
 */
export function SiteContentGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/") return <>{children}</>;

  return (
    <>
      <HomeLanguageSync />
      <ProfessionalContacts />
      {children}
    </>
  );
}
