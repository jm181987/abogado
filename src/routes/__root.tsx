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

const FAVICON = "/navbar-logo.jpg";

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
      { rel: "icon", href: FAVICON, type: "image/png" }, { rel: "shortcut icon", href: FAVICON, type: "image/png" }, { rel: "apple-touch-icon", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }), shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) { return <html lang="es"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function RootComponent() { const { queryClient } = Route.useRouteContext(); return <QueryClientProvider client={queryClient}><AuthProvider><UiEnhancer /><PlansBootstrap /><SiteContentGate><Outlet /></SiteContentGate></AuthProvider></QueryClientProvider>; }
