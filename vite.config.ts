import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const siteEnhancementsPlugin = {
  name: "bsp-site-enhancements",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, "/");
    const cleanId = normalizedId.split("?")[0];
    const isIndexRoute = cleanId.endsWith("/src/routes/index.tsx");
    const isRootRoute = cleanId.endsWith("/src/routes/__root.tsx");
    const isAdminRoute = cleanId.endsWith("/src/routes/admin.tsx");
    const isContentEditor = cleanId.endsWith("/src/components/admin/ContentEditor.tsx");
    if (!isIndexRoute && !isRootRoute && !isAdminRoute && !isContentEditor) return null;

    let transformed = code
      .replaceAll("Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe", "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica")
      .replaceAll("Asesoría jurídica ética, estratégica y bilingüe en Sant'Ana do Livramento y Rivera. Servicios legales para personas y empresas en la frontera Brasil–Uruguay.", "Assessoria jurídica ética e estratégica para pessoas, famílias e empresas no Brasil.")
      .replaceAll("abogado Livramento, abogado Rivera, asesoría jurídica Brasil Uruguay, derecho de familia, contratos, derecho empresarial, derecho fronterizo", "advogado Livramento, advocacia Sant'Ana do Livramento, assessoria jurídica Brasil, direito de família, contratos, direito empresarial")
      .replaceAll("Asesoría Jurídica Brasil–Uruguay", "Bouchacourt · Simões Pires")
      .replaceAll("Defensa y asesoría jurídica con atención en español y portugués para personas y empresas de Livramento, Rivera y la frontera Brasil–Uruguay.", "Assessoria jurídica ética e estratégica para pessoas, famílias e empresas no Brasil.")
      .replaceAll("Asesoría legal estratégica y bilingüe para personas y empresas en la frontera Brasil–Uruguay.", "Assessoria jurídica estratégica para pessoas, famílias e empresas no Brasil.")
      .replaceAll("Bouchacourt · Simões Pires | Advocacia Brasil–Uruguai", "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica")
      .replaceAll("Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas na fronteira Brasil–Uruguai.", "Assessoria jurídica ética e estratégica para pessoas, famílias e empresas no Brasil.")
      .replaceAll("Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica Brasil–Uruguai", "Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica")
      .replaceAll("es_UY", "es_ES")
      .replaceAll("/og-social.png", "/og-social.jpg")
      .replaceAll('content: "image/png"', 'content: "image/jpeg"');

    if (isIndexRoute) {
      if (!transformed.includes('from "@/components/HeroMedia"')) transformed = transformed.replace('import { ThemeInjector } from "@/components/ThemeInjector";', 'import { ThemeInjector } from "@/components/ThemeInjector";\nimport { HeroMedia } from "@/components/HeroMedia";');
      if (!transformed.includes('from "@/hooks/use-language"')) transformed = transformed.replace('import { ThemeInjector } from "@/components/ThemeInjector";', 'import { ThemeInjector } from "@/components/ThemeInjector";\nimport { usePreferredLanguage } from "@/hooks/use-language";');
      if (!transformed.includes('from "@/components/PracticeAreasSection"')) transformed = transformed.replace('import { ThemeInjector } from "@/components/ThemeInjector";', 'import { ThemeInjector } from "@/components/ThemeInjector";\nimport { PracticeAreasSection } from "@/components/PracticeAreasSection";');

      transformed = transformed
        .replace('const [lang, setLang] = useState<Lang>("es");','const { lang, setLang } = usePreferredLanguage();')
        .replace('const heroSrc = t.media?.heroImage || heroImg;','const galleryHeroFallback = t.media?.gallery?.[0];\n  const heroSrc = t.media?.heroImage || galleryHeroFallback || heroImg;')
        .replace('const hasCustomHero = Boolean(t.media?.heroImage);','const hasCustomHero = Boolean(t.media?.heroImage || galleryHeroFallback);')
        .replace('const isTransparentHero = hasCustomHero && /\\.png(\\?|$)/i.test(heroSrc);','const isTransparentHero = false;')
        .replace('<nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6">','<nav className="mx-auto flex h-[92px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">')
        .replace('<span className="grid size-10 place-items-center rounded-full border border-primary/25 bg-primary/8 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">\n              <Scale className="size-5" strokeWidth={1.7} />\n            </span>\n            ','')
        .replace('<img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-9 w-auto" />','<img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-14 w-auto max-w-[210px] object-contain sm:h-16 sm:max-w-[260px] lg:h-20 lg:max-w-[330px]" />')
        .replace('<a href="#inicio" onClick={closeMenu} className="group flex items-center gap-3">','<a href="#inicio" onClick={closeMenu} aria-label={lang === "pt" ? "Ir ao início" : "Ir al inicio"} className="group flex min-w-0 shrink-0 items-center">')
        .replace('<div className="hidden items-center gap-7 lg:flex">','<div className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-7">')
        .replace('<div className="hidden items-center gap-2 sm:flex">','<div className="hidden shrink-0 items-center gap-2 sm:flex">')
        .replace('<div className="absolute inset-0 -z-20">','<div className="absolute inset-0 z-0 overflow-hidden bg-background">')
        .replace('<div className="mx-auto w-full max-w-7xl px-5 sm:px-6">','<div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6">')
        .replace('<img src={heroSrc} alt="Estudio jurídico" className="h-full w-full object-cover object-center" width={1600} height={1200} />','<HeroMedia lang={lang} media={t.media as any} fallbackSrc={heroSrc} />')
        .replace('bg-gradient-to-r from-background via-background/82 to-background/35','bg-gradient-to-r from-background via-background/82 to-background/35 lg:hidden')
        .replace('bg-gradient-to-r from-background via-background/92 to-background/55','bg-gradient-to-r from-background via-background/92 to-background/55 lg:hidden')
        .replace('absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent','absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent lg:hidden')
        .replace('<div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">','<div className="mx-auto max-w-7xl px-5 sm:px-6">')
        .replace(
          '{gallery.map((url, index) => <img key={url} src={url} alt={`${lang === "es" ? "Estudio jurídico" : "Escritório de advocacia"} ${index + 1}`} loading="lazy" className="aspect-[4/5] w-full rounded-[1.5rem] border border-border object-cover shadow-sm" />)}',
          '{gallery.map((url, index) => <div key={url} className="flex min-h-48 items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-muted/20 shadow-sm"><img src={url} alt={`${lang === "es" ? "Estudio jurídico" : "Escritório de advocacia"} ${index + 1}`} loading="lazy" decoding="async" className="mx-auto block h-auto max-h-[720px] w-auto max-w-full object-contain [image-rendering:auto]" /></div>)}'
        )
        .replace(
          '{ icon: MessageCircle, title: t.contact.whats, body: phoneDigits ? <a href={WHATS} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{t.whatsapp?.display || t.hero.ctaWhats}</a> : <span>{t.hero.ctaWhats}</span> },',
          '{ icon: MessageCircle, title: t.contact.whats, body: <div className="space-y-3">{phoneDigits ? <a href={WHATS} target="_blank" rel="noreferrer" className="block font-semibold text-primary hover:underline">{t.whatsapp?.display || t.hero.ctaWhats}</a> : <span className="block">{t.hero.ctaWhats}</span>}<div className="border-t border-border pt-3"><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Instagram</span><a href="https://www.instagram.com/bouchacourtsimoespires/" target="_blank" rel="noreferrer" className="mt-1 block font-semibold text-primary hover:underline">@bouchacourtsimoespires</a></div></div> },'
        );

      transformed = transformed.replace(/\n\s*<div className="grid gap-4 sm:grid-cols-2">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/section>\n\n\s*<section id="planes"/, '\n          </div>\n        </section>\n\n        <section id="planes"');
      transformed = transformed.replace(/<section id="planes"[\s\S]*?<\/section>\n\n\s*<section id="diferenciadores"/, '<PracticeAreasSection lang={lang} data={(t as any).practiceAreas} />\n\n        <section id="diferenciadores"');
      transformed = transformed.replace(/\n\s*<footer className="border-t border-border bg-muted\/20 py-8">[\s\S]*?<\/footer>/, "");
    }

    if (isAdminRoute) {
      transformed = transformed
        .replace('type AdminTab = "content" | "plans" | "photos";', 'type AdminTab = "content" | "plans" | "photos" | "analytics";')
        .replace('    { id: "plans" as const, label: ui(lang, "Planes", "Planos"), description: ui(lang, "Servicios, precios y orden", "Serviços, preços e ordem") },\n', '')
        .replace('    { id: "photos" as const, label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Portada y galería", "Capa e galeria") },', '    { id: "photos" as const, label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Galería de imágenes reutilizable", "Galeria de imagens reutilizável") },\n    { id: "analytics" as const, label: "Analytics & Pixel", description: ui(lang, "Medición, cookies y conversiones", "Medição, cookies e conversões") },')
        .replace('label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Portada y galería", "Capa e galeria")','label: ui(lang, "Fotos", "Fotos"), description: ui(lang, "Galería de imágenes reutilizable", "Galeria de imagens reutilizável")')
        .replace('description: ui(lang, "Textos, marca y datos del sitio", "Textos, marca e dados do site")','description: ui(lang, "Todo el contenido real publicado en la homepage", "Todo o conteúdo real publicado na homepage")');
      if (!transformed.includes('from "@/components/admin/MobileHeroAdmin"')) transformed = transformed.replace('import { ContentEditor } from "@/components/admin/ContentEditor";','import { ContentEditor } from "@/components/admin/ContentEditor";\nimport { MobileHeroAdmin } from "@/components/admin/MobileHeroAdmin";');
      if (!transformed.includes('from "@/components/admin/PracticeAreasAdmin"')) transformed = transformed.replace('import { ContentEditor } from "@/components/admin/ContentEditor";','import { ContentEditor } from "@/components/admin/ContentEditor";\nimport { PracticeAreasAdmin } from "@/components/admin/PracticeAreasAdmin";');
      if (!transformed.includes('from "@/components/admin/TrackingAdmin"')) transformed = transformed.replace('import { ContentEditor } from "@/components/admin/ContentEditor";','import { ContentEditor } from "@/components/admin/ContentEditor";\nimport { TrackingAdmin } from "@/components/admin/TrackingAdmin";');
      transformed = transformed.replace('{tab === "plans" && <PlansTab lang={lang} />}','');
      transformed = transformed.replace('{tab === "photos" && <PhotosTab lang={lang} />}','{tab === "photos" && <PhotosTab lang={lang} />}\n        {tab === "analytics" && <TrackingAdmin lang={lang} />}');
      if (!transformed.includes('<MobileHeroAdmin lang={lang} />')) transformed = transformed.replace('<div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">','<div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">');
    }

    if (isContentEditor) {
      // ContentEditor now natively uses resolveSiteContent and current homepage editors.
    }

    if (isRootRoute) {
      if (!transformed.includes('from "@/components/CookieTracking"')) transformed = transformed.replace('import { PlansBootstrap } from "@/components/admin/PlansBootstrap";','import { PlansBootstrap } from "@/components/admin/PlansBootstrap";\nimport { CookieTracking } from "@/components/CookieTracking";');
      if (!transformed.includes('<PlansBootstrap /><CookieTracking />')) transformed = transformed.replace('<UiEnhancer /><PlansBootstrap />','<UiEnhancer /><PlansBootstrap /><CookieTracking />');
      if (!transformed.includes('from "@/components/LegalFooter"')) transformed = transformed.replace('import { PlansBootstrap } from "@/components/admin/PlansBootstrap";','import { PlansBootstrap } from "@/components/admin/PlansBootstrap";\nimport { LegalFooter } from "@/components/LegalFooter";');
      if (!transformed.includes('<Outlet /><LegalFooter />')) transformed = transformed.replace('<SiteContentGate><Outlet /></SiteContentGate>','<SiteContentGate><Outlet /><LegalFooter /></SiteContentGate>');
    }

    return transformed;
  },
};

export default defineConfig({ plugins: [siteEnhancementsPlugin] });
