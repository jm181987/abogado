import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { PhotosAdmin } from "@/components/admin/PhotosAdmin";
import { PlansAdmin } from "@/components/admin/PlansAdmin";
import { useAuth } from "@/hooks/use-auth";
import { usePreferredLanguage } from "@/hooks/use-language";
import type { Lang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Asesoría Jurídica" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type AdminTab = "content" | "plans" | "photos";
const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = usePreferredLanguage();
  const [tab, setTab] = useState<AdminTab>("content");
  const { data: siteContent } = useSiteContent(lang);
  const brand = siteContent?.brand ?? {
    name1: ui(lang, "Asesoría", "Assessoria"),
    name2: ui(lang, "Jurídica", "Jurídica"),
    logoUrl: "",
  };
  const tabs = [
    { id: "content" as const, label: ui(lang, "Contenido", "Conteúdo"), description: ui(lang, "Textos, marca y datos del sitio", "Textos, marca e dados do site") },
    { id: "plans" as const, label: ui(lang, "Planes", "Planos"), description: ui(lang, "Servicios, precios y orden", "Serviços, preços e ordem") },
    { id: "photos" as const, label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Portada y galería", "Capa e galeria") },
  ];

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{ui(lang, "Cargando…", "Carregando…")}</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <LanguageSelector lang={lang} setLang={setLang} />
        <h1 className="font-display text-2xl">{ui(lang, "Sin acceso", "Sem acesso")}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {ui(lang, `Tu cuenta (${user.email}) no tiene rol de administrador.`, `Sua conta (${user.email}) não possui função de administrador.`)}
        </p>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground underline">{ui(lang, "Cerrar sesión", "Sair")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-9 w-auto max-w-48 object-contain" />
            ) : (
              <span className="min-w-0 leading-none">
                <span className="block truncate font-display text-xl font-semibold">{brand.name1}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{brand.name2}</span>
              </span>
            )}
            <span className="hidden sm:inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 text-sm">
            <LanguageSelector lang={lang} setLang={setLang} compact />
            <span className="text-muted-foreground hidden lg:inline truncate max-w-56">{user.email}</span>
            <button onClick={signOut} className="min-h-10 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted">{ui(lang, "Salir", "Sair")}</button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6" aria-label={ui(lang, "Secciones del panel", "Seções do painel")}>
          <div className="flex min-w-max gap-2 pb-3">
            {tabs.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`min-h-12 rounded-xl border px-4 py-2 text-left transition ${tab === item.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-muted/50"}`}>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={`mt-0.5 block text-[10px] ${tab === item.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{item.description}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {tab === "content" && <ContentEditor uiLang={lang} />}
        {tab === "plans" && <PlansAdmin lang={lang} />}
        {tab === "photos" && <PhotosAdmin lang={lang} />}
      </main>
    </div>
  );
}

function LanguageSelector({ lang, setLang, compact = false }: { lang: Lang; setLang: (lang: Lang) => void; compact?: boolean }) {
  return (
    <div className="flex items-center rounded-full border border-border bg-card p-1 text-xs" aria-label={ui(lang, "Idioma", "Idioma")}>
      {(["es", "pt"] as const).map(value => (
        <button key={value} type="button" onClick={() => setLang(value)} className={`${compact ? "px-2.5" : "px-3"} rounded-full py-1.5 font-bold uppercase transition ${lang === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{value}</button>
      ))}
    </div>
  );
}
