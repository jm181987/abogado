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
    if (!isIndexRoute && !isRootRoute && !isAdminRoute) return null;

    let transformed = code
      .replaceAll("Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe", "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica")
      .replaceAll("Asesoría jurídica ética, estratégica y bilingüe en Sant'Ana do Livramento y Rivera. Servicios legales para personas y empresas en la frontera Brasil–Uruguay.", "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.")
      .replaceAll("abogado Livramento, abogado Rivera, asesoría jurídica Brasil Uruguay, derecho de familia, contratos, derecho empresarial, derecho fronterizo", "advogado Livramento, advocacia Sant'Ana do Livramento, assessoria jurídica, direito de família, contratos, direito empresarial, advocacia bilíngue")
      .replaceAll("Asesoría Jurídica Brasil–Uruguay", "Bouchacourt · Simões Pires")
      .replaceAll("Defensa y asesoría jurídica con atención en español y portugués para personas y empresas de Livramento, Rivera y la frontera Brasil–Uruguay.", "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.")
      .replaceAll("Asesoría legal estratégica y bilingüe para personas y empresas en la frontera Brasil–Uruguay.", "Assessoria e asesoría jurídica estratégica e bilíngue para pessoas, famílias e empresas.")
      .replaceAll("Bouchacourt · Simões Pires | Advocacia Brasil–Uruguai", "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica")
      .replaceAll("Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas na fronteira Brasil–Uruguai.", "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.")
      .replaceAll("Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica Brasil–Uruguai", "Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica")
      .replaceAll("es_UY", "es_ES")
      .replaceAll("/og-social.png", "/og-social.jpg")
      .replaceAll('content: "image/png"', 'content: "image/jpeg"');

    if (isIndexRoute) {
      transformed = transformed
        .replace(
          'const heroSrc = t.media?.heroImage || heroImg;',
          'const savedHeroSrc = t.media?.heroImage || (t.media as any)?.heroMobileImage;\n  const heroSrc = savedHeroSrc || heroImg;\n  const mobileHeroSrc = heroSrc;',
        )
        .replace(
          'const hasCustomHero = Boolean(t.media?.heroImage);',
          'const hasCustomHero = Boolean(t.media?.heroImage || (t.media as any)?.heroMobileImage);',
        )
        .replace(
          '<div className="absolute inset-0 -z-20">',
          '<div className="absolute inset-0 z-0">',
        )
        .replace(
          '<div className="mx-auto w-full max-w-7xl px-5 sm:px-6">',
          '<div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6">',
        )
        .replace(
          '<img src={heroSrc} alt="Estudio jurídico" className="h-full w-full object-cover object-center" width={1600} height={1200} />',
          '<picture className="block h-full w-full"><source media="(max-width: 1023px)" srcSet={mobileHeroSrc} /><img src={heroSrc} alt="Estudio jurídico" className="h-full w-full object-cover object-right lg:object-center" width={1600} height={1200} loading="eager" fetchPriority="high" decoding="async" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "true"; event.currentTarget.src = heroImg; } }} /></picture>',
        )
        .replace(
          '<div aria-hidden="true" className="absolute inset-y-8 right-0 hidden w-[52%] bg-contain bg-center bg-no-repeat opacity-95 md:block" style={{ backgroundImage: `url(${heroSrc})` }} />',
          '<img src={heroSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain object-right opacity-95" loading="eager" fetchPriority="high" decoding="async" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "true"; event.currentTarget.src = heroImg; } }} />',
        );

      const oldFooter = /\n\s*<footer className="border-t border-border bg-muted\/20 py-8">[\s\S]*?<\/footer>/;
      transformed = transformed.replace(oldFooter, "");
    }

    if (isAdminRoute) {
      if (!transformed.includes('from "@/components/admin/MobileHeroAdmin"')) {
        transformed = transformed.replace(
          'import { ContentEditor } from "@/components/admin/ContentEditor";',
          'import { ContentEditor } from "@/components/admin/ContentEditor";\nimport { MobileHeroAdmin } from "@/components/admin/MobileHeroAdmin";',
        );
      }
      if (!transformed.includes('<MobileHeroAdmin lang={lang} />')) {
        transformed = transformed.replace(
          '<div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">',
          '<MobileHeroAdmin lang={lang} />\n      <div className="admin-photo-uploader rounded-2xl border border-dashed border-border p-6 bg-card">',
        );
      }
    }

    if (isRootRoute) {
      transformed = transformed.replace(/const FAVICON = "data:image\/png;base64,[^"]+";/, 'const FAVICON = "/favicon.ico";');

      if (!transformed.includes('from "@/components/LegalFooter"')) {
        transformed = transformed.replace(
          'import { PlansBootstrap } from "@/components/admin/PlansBootstrap";',
          'import { PlansBootstrap } from "@/components/admin/PlansBootstrap";\nimport { LegalFooter } from "@/components/LegalFooter";',
        );
      }
      if (!transformed.includes('<Outlet /><LegalFooter />')) {
        transformed = transformed.replace(
          '<SiteContentGate><Outlet /></SiteContentGate>',
          '<SiteContentGate><Outlet /><LegalFooter /></SiteContentGate>',
        );
      }
    }

    return transformed;
  },
};

export default defineConfig({ plugins: [siteEnhancementsPlugin] });
