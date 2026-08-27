import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

function currentLanguage(): Lang {
  if (typeof window === "undefined") return "es";
  const saved = window.localStorage.getItem("site-language");
  if (saved === "pt" || saved === "es") return saved;
  return document.documentElement.lang.toLowerCase().startsWith("pt") ? "pt" : "es";
}

export function LegalFooter() {
  const [lang, setLang] = useState<Lang>(currentLanguage);

  useEffect(() => {
    const sync = () => setLang(currentLanguage());
    document.addEventListener("click", sync, true);
    window.addEventListener("storage", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => {
      document.removeEventListener("click", sync, true);
      window.removeEventListener("storage", sync);
      observer.disconnect();
    };
  }, []);

  const es = lang === "es";
  return (
    <section aria-label={es ? "Área legal" : "Área jurídica"} className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{es ? "Área legal" : "Área jurídica"}</p>
              <h2 className="mt-3 font-display text-2xl text-foreground">Bouchacourt · Simões Pires</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{es ? "Información institucional, identificación profesional y condiciones de uso del sitio." : "Informações institucionais, identificação profissional e condições de uso do site."}</p>
              <div className="mt-5 space-y-1.5 text-xs leading-5 text-foreground/75">
                <p><strong>Dra. Macarena Bouchacourt</strong> · OAB/RS 106.130</p>
                <p><strong>Dra. Daniele Simões Pires</strong> · OAB/RS 108.350</p>
                <p><strong>Dr. Matheus Figueiredo</strong></p>
                <p className="pt-2">Rua Uruguai, 1248, Sala 2 · Sant'Ana do Livramento/RS</p>
              </div>
            </div>
            <div className="grid gap-3">
              <details className="rounded-2xl border border-border bg-background px-5 py-4">
                <summary className="cursor-pointer font-semibold text-foreground">Aviso Legal</summary>
                <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                  <p>{es ? "El contenido de este sitio es institucional e informativo y no sustituye una consulta jurídica individualizada. El acceso al sitio o el envío de un mensaje no crea por sí solo una relación abogado-cliente." : "O conteúdo deste site é institucional e informativo e não substitui uma consulta jurídica individualizada. O acesso ao site ou o envio de uma mensagem não cria, por si só, uma relação advogado-cliente."}</p>
                  <p>{es ? "Cada asunto requiere análisis profesional de sus hechos y documentos. No se garantizan resultados específicos y cualquier contratación se formaliza de manera independiente." : "Cada caso exige análise profissional de seus fatos e documentos. Não são garantidos resultados específicos e qualquer contratação é formalizada de maneira independente."}</p>
                </div>
              </details>
              <details className="rounded-2xl border border-border bg-background px-5 py-4">
                <summary className="cursor-pointer font-semibold text-foreground">{es ? "Política de Privacidad y LGPD" : "Política de Privacidade e LGPD"}</summary>
                <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                  <p>{es ? "El sitio utiliza los datos necesarios para su funcionamiento y puede guardar localmente la preferencia de idioma. Los datos enviados voluntariamente por WhatsApp se utilizan para responder consultas y gestionar el contacto profesional." : "O site utiliza os dados necessários ao seu funcionamento e pode armazenar localmente a preferência de idioma. Os dados enviados voluntariamente pelo WhatsApp são utilizados para responder consultas e administrar o contato profissional."}</p>
                  <p>{es ? "No comercializamos datos personales. El titular puede solicitar información, corrección o eliminación por los canales de contacto publicados, conforme a la legislación aplicable y la LGPD." : "Não comercializamos dados pessoais. O titular pode solicitar informações, correção ou exclusão pelos canais de contato publicados, conforme a legislação aplicável e a LGPD."}</p>
                </div>
              </details>
              <details className="rounded-2xl border border-border bg-background px-5 py-4">
                <summary className="cursor-pointer font-semibold text-foreground">{es ? "Términos de Uso" : "Termos de Uso"}</summary>
                <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                  <p>{es ? "Al utilizar este sitio, el visitante se compromete a hacerlo de forma lícita y a no afectar su seguridad, disponibilidad o funcionamiento. Los textos, identidad visual y contenidos institucionales están protegidos por la normativa aplicable." : "Ao utilizar este site, o visitante compromete-se a fazê-lo de forma lícita e a não afetar sua segurança, disponibilidade ou funcionamento. Os textos, identidade visual e conteúdos institucionais são protegidos pela legislação aplicável."}</p>
                  <p>{es ? "Los enlaces a servicios de terceros se ofrecen para facilitar el contacto y están sujetos también a las políticas de esas plataformas." : "Os links para serviços de terceiros são disponibilizados para facilitar o contato e também estão sujeitos às políticas dessas plataformas."}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
