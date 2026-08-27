import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/site-content";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";
import { HomeLanguageSync } from "@/components/HomeLanguageSync";
import { usePreferredLanguage } from "@/hooks/use-language";

export function SiteContentGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { lang } = usePreferredLanguage();
  const siteContent = useSiteContent(lang);

  if (pathname !== "/") return <>{children}</>;
  if (siteContent.data) {
    return (
      <>
        <HomeLanguageSync />
        <ProfessionalContacts />
        {children}
      </>
    );
  }

  if (siteContent.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-primary">{lang === "pt" ? "Conteúdo temporariamente indisponível" : "Contenido temporalmente no disponible"}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {lang === "pt" ? "Não foi possível carregar a versão publicada" : "No pudimos cargar la versión publicada"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {lang === "pt"
              ? "Para evitar mostrar uma página genérica ou informações incorretas, o site aguardará até recuperar seu conteúdo real."
              : "Para evitar mostrar una página genérica o información que no corresponde, el sitio esperará a recuperar tu contenido real."}
          </p>
          <button
            type="button"
            onClick={() => siteContent.refetch()}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            {lang === "pt" ? "Tentar novamente" : "Reintentar"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground" aria-busy="true">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">{lang === "pt" ? "Carregando o site…" : "Cargando tu sitio…"}</p>
      </div>
    </main>
  );
}
