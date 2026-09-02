import type { ReactNode } from "react";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";

export function SiteContentGate({ children }: { children: ReactNode }) {
  // El contenido SSR se muestra inmediatamente y permanece visible durante la
  // hidratación. No limpiamos caches, service workers ni forzamos sincronizaciones
  // al cargar: esas tareas podían producir una segunda fase visual similar a una
  // recarga/fallback aunque el servidor ya hubiera entregado la página.
  return (
    <>
      <ProfessionalContacts />
      {children}
    </>
  );
}
