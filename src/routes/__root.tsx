import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import carouselCleanupCss from "../carousel-cleanup.css?url";
import carouselScrollbarCss from "../carousel-scrollbar.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/use-auth";
import { UiEnhancer } from "@/components/UiEnhancer";
import { SiteContentGate } from "@/components/SiteContentGate";
import { PlansBootstrap } from "@/components/admin/PlansBootstrap";

const FAVICON = "data:image/png;base64,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";

function NotFoundComponent() { return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="font-display text-7xl font-semibold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2><p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe o fue movida.</p><div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Volver al inicio</Link></div></div></div>; }
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) { console.error(error); const router = useRouter(); useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]); return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="font-display text-3xl font-semibold text-foreground">No pudimos cargar esta página</h1><p className="mt-3 text-sm text-muted-foreground">Ocurrió un error inesperado. Puedes volver a intentarlo o regresar al inicio.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Intentar nuevamente</button><a href="/" className="rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground">Volver al inicio</a></div></div></div>; }

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe" },
      { name: "description", content: "Asesoría jurídica ética, estratégica y bilingüe en Sant'Ana do Livramento y Rivera. Servicios legales para personas y empresas en la frontera Brasil–Uruguay." },
      { name: "keywords", content: "abogado Livramento, abogado Rivera, asesoría jurídica Brasil Uruguay, derecho de familia, contratos, derecho empresarial, derecho fronterizo" },
      { name: "author", content: "Asesoría Jurídica Brasil–Uruguay" },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
      { property: "og:title", content: "Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe" },
      { property: "og:description", content: "Defensa y asesoría jurídica con atención en español y portugués para personas y empresas de Livramento, Rivera y la frontera Brasil–Uruguay." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_UY" },
      { property: "og:locale:alternate", content: "pt_BR" },
      { property: "og:site_name", content: "Asesoría Jurídica Brasil–Uruguay" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe" },
      { name: "twitter:description", content: "Asesoría legal estratégica y bilingüe para personas y empresas en la frontera Brasil–Uruguay." },
      { name: "theme-color", content: "#1f2937" },
      { name: "application-name", content: "Asesoría Jurídica Brasil–Uruguay" },
    ],
    links: [
      { rel: "stylesheet", href: appCss }, { rel: "stylesheet", href: carouselCleanupCss }, { rel: "stylesheet", href: carouselScrollbarCss },
      { rel: "icon", href: FAVICON, type: "image/png", sizes: "64x64" }, { rel: "shortcut icon", href: FAVICON, type: "image/png" }, { rel: "apple-touch-icon", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }), shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) { return <html lang="es"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function RootComponent() { const { queryClient } = Route.useRouteContext(); return <QueryClientProvider client={queryClient}><AuthProvider><UiEnhancer /><PlansBootstrap /><SiteContentGate><Outlet /></SiteContentGate></AuthProvider></QueryClientProvider>; }
