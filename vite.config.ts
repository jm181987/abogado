import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const socialMetadataPlugin = {
  name: "bsp-social-metadata",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, "/");
    const isMetadataRoute =
      normalizedId.endsWith("/src/routes/index.tsx") ||
      normalizedId.endsWith("/src/routes/__root.tsx");

    if (!isMetadataRoute) return null;

    return code
      .replaceAll(
        "Asesoría Jurídica Brasil–Uruguay | Abogacía Bilingüe",
        "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica",
      )
      .replaceAll(
        "Asesoría jurídica ética, estratégica y bilingüe en Sant'Ana do Livramento y Rivera. Servicios legales para personas y empresas en la frontera Brasil–Uruguay.",
        "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.",
      )
      .replaceAll(
        "abogado Livramento, abogado Rivera, asesoría jurídica Brasil Uruguay, derecho de familia, contratos, derecho empresarial, derecho fronterizo",
        "advogado Livramento, advocacia Sant'Ana do Livramento, assessoria jurídica, direito de família, contratos, direito empresarial, advocacia bilíngue",
      )
      .replaceAll(
        "Asesoría Jurídica Brasil–Uruguay",
        "Bouchacourt · Simões Pires",
      )
      .replaceAll(
        "Defensa y asesoría jurídica con atención en español y portugués para personas y empresas de Livramento, Rivera y la frontera Brasil–Uruguay.",
        "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.",
      )
      .replaceAll(
        "Asesoría legal estratégica y bilingüe para personas y empresas en la frontera Brasil–Uruguay.",
        "Assessoria e asesoría jurídica estratégica e bilíngue para pessoas, famílias e empresas.",
      )
      .replaceAll(
        "Bouchacourt · Simões Pires | Advocacia Brasil–Uruguai",
        "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica",
      )
      .replaceAll(
        "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas na fronteira Brasil–Uruguai.",
        "Assessoria e asesoría jurídica ética, estratégica e bilíngue para pessoas, famílias e empresas em Sant'Ana do Livramento.",
      )
      .replaceAll(
        "Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica Brasil–Uruguai",
        "Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica",
      )
      .replaceAll("es_UY", "es_ES")
      .replaceAll("/og-social.png", "/og-social.jpg")
      .replaceAll('content: "image/png"', 'content: "image/jpeg"');
  },
};

export default defineConfig({
  plugins: [socialMetadataPlugin],
});
