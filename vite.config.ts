import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const legalFooter = `
        <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-6">
          <div className="rounded-[1.75rem] border border-border bg-card/70 p-6 sm:p-8">
            <div className="grid gap-7 lg:grid-cols-[1.1fr_1.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{lang === "es" ? "Área legal" : "Área jurídica"}</p>
                <h2 className="mt-3 font-display text-2xl text-foreground">Bouchacourt · Simões Pires</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {lang === "es"
                    ? "Sitio institucional de servicios jurídicos. Información de identificación y condiciones de uso para una navegación transparente y segura."
                    : "Site institucional de serviços jurídicos. Informações de identificação e condições de uso para uma navegação transparente e segura."}
                </p>
                <div className="mt-5 space-y-1.5 text-xs leading-5 text-foreground/70">
                  <p><strong className="text-foreground">Dra. Macarena Bouchacourt</strong> · OAB/RS 106.130</p>
                  <p><strong className="text-foreground">Dra. Daniele Simões Pires</strong> · OAB/RS 108.350</p>
                  <p><strong className="text-foreground">Dr. Matheus Figueiredo</strong></p>
                  <p className="pt-2">Rua Uruguai, 1248, Sala 2 · Sant'Ana do Livramento/RS</p>
                </div>
              </div>

              <div className="grid gap-3">
                <details className="group rounded-2xl border border-border bg-background px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                    {lang === "es" ? "Aviso Legal" : "Aviso Legal"}
                  </summary>
                  <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                    <p>{lang === "es" ? "El contenido de este sitio tiene carácter institucional e informativo y no sustituye una consulta jurídica individualizada. El acceso al sitio o el envío de un mensaje no crea, por sí solo, una relación abogado-cliente." : "O conteúdo deste site tem caráter institucional e informativo e não substitui uma consulta jurídica individualizada. O acesso ao site ou o envio de uma mensagem não cria, por si só, uma relação advogado-cliente."}</p>
                    <p>{lang === "es" ? "Cada asunto requiere análisis profesional de sus hechos y documentos. No se garantizan resultados específicos y cualquier contratación se formaliza de manera independiente." : "Cada caso exige análise profissional de seus fatos e documentos. Não são garantidos resultados específicos e qualquer contratação é formalizada de maneira independente."}</p>
                  </div>
                </details>

                <details className="group rounded-2xl border border-border bg-background px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                    {lang === "es" ? "Política de Privacidad y LGPD" : "Política de Privacidade e LGPD"}
                  </summary>
                  <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                    <p>{lang === "es" ? "El sitio utiliza únicamente los datos necesarios para su funcionamiento y puede guardar localmente la preferencia de idioma. Los datos que el usuario envía voluntariamente por WhatsApp se utilizan para responder la consulta y gestionar el contacto profesional." : "O site utiliza apenas os dados necessários ao seu funcionamento e pode armazenar localmente a preferência de idioma. Os dados enviados voluntariamente pelo usuário via WhatsApp são utilizados para responder à consulta e administrar o contato profissional."}</p>
                    <p>{lang === "es" ? "WhatsApp es un servicio externo y su tratamiento de datos se rige también por sus propias políticas. No comercializamos datos personales. El titular puede solicitar información, corrección o eliminación de datos directamente al estudio por los canales de contacto publicados en este sitio, conforme a la legislación aplicable y a la LGPD." : "O WhatsApp é um serviço externo e seu tratamento de dados também é regido por suas próprias políticas. Não comercializamos dados pessoais. O titular pode solicitar informações, correção ou exclusão de dados diretamente ao escritório pelos canais de contato publicados neste site, conforme a legislação aplicável e a LGPD."}</p>
                  </div>
                </details>

                <details className="group rounded-2xl border border-border bg-background px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                    {lang === "es" ? "Términos de Uso" : "Termos de Uso"}
                  </summary>
                  <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                    <p>{lang === "es" ? "Al utilizar este sitio, el visitante se compromete a hacerlo de forma lícita y a no intentar afectar su seguridad, disponibilidad o funcionamiento. Los textos, identidad visual y demás contenidos institucionales están protegidos por la normativa aplicable." : "Ao utilizar este site, o visitante compromete-se a fazê-lo de forma lícita e a não tentar afetar sua segurança, disponibilidade ou funcionamento. Os textos, identidade visual e demais conteúdos institucionais são protegidos pela legislação aplicável."}</p>
                    <p>{lang === "es" ? "Los enlaces a servicios de terceros se ofrecen para facilitar el contacto. El estudio no controla la disponibilidad ni las políticas de esas plataformas. Estos términos pueden actualizarse cuando sea necesario para reflejar cambios legales o técnicos." : "Os links para serviços de terceiros são disponibilizados para facilitar o contato. O escritório não controla a disponibilidade nem as políticas dessas plataformas. Estes termos podem ser atualizados quando necessário para refletir alterações legais ou técnicas."}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
`;

const socialMetadataPlugin = {
  name: "bsp-social-metadata",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, "/");
    const isIndexRoute = normalizedId.endsWith("/src/routes/index.tsx");
    const isMetadataRoute =
      isIndexRoute ||
      normalizedId.endsWith("/src/routes/__root.tsx");

    if (!isMetadataRoute) return null;

    let transformed = code
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

    if (isIndexRoute && !transformed.includes("Política de Privacidad y LGPD")) {
      transformed = transformed.replace(
        '<footer className="border-t border-border bg-muted/20 py-8">',
        `<footer className="border-t border-border bg-muted/20 py-8">${legalFooter}`,
      );
    }

    return transformed;
  },
};

export default defineConfig({
  plugins: [socialMetadataPlugin],
});
