import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const siteEnhancementsPlugin = {
  name: "bsp-site-enhancements",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, "/");
    const isIndexRoute = normalizedId.endsWith("/src/routes/index.tsx");
    const isRootRoute = normalizedId.endsWith("/src/routes/__root.tsx");
    if (!isIndexRoute && !isRootRoute) return null;

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
        .replaceAll(
          'className="absolute inset-y-8 right-0 hidden w-[52%] bg-contain bg-center bg-no-repeat opacity-95 md:block"',
          'className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-45 sm:opacity-60 md:inset-y-8 md:left-auto md:right-0 md:w-[72%] md:bg-right md:opacity-85 lg:w-[52%] lg:opacity-95"',
        )
        .replaceAll(
          'className="h-full w-full object-cover object-center"',
          'className="h-full w-full object-contain object-center lg:object-cover"',
        );

      const oldFooter = /\n\s*<footer className="border-t border-border bg-muted\/20 py-8">[\s\S]*?<\/footer>/;
      transformed = transformed.replace(oldFooter, "");
    }

    if (isRootRoute) {
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
