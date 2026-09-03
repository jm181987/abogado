import type { Lang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

type Professional = { name?: string; role?: string; credential?: string; bio?: string; photo?: string };
type ProfessionalsData = { title?: string; subtitle?: string; items?: Professional[] };

const DEFAULTS: Record<Lang, Required<ProfessionalsData>> = {
  pt: { title: "Quem está à frente do escritório", subtitle: "Conheça os profissionais responsáveis pela condução técnica, próxima e responsável de cada atendimento.", items: [
    { name: "Daniele Dachi Simões Pires", role: "Advogada", credential: "OAB/RS 108.350", bio: "Advogada desde 2017, formada pela Universidade da Região da Campanha — URCAMP, e pós-graduada em Direito de Família e Sucessões pela Faculdade CERS — Complexo de Ensino Renato Saraiva.\n\nFoi Conselheira da OAB, Subseção de Sant’Ana do Livramento, na gestão 2022/2024, e atualmente é Conselheira Titular da OAB, Subseção de Sant’Ana do Livramento, na gestão 2025/2027.\n\nExerce, ainda, a função de Coordenadora da Comissão de Direito da Criança e do Adolescente da OAB, Subseção de Sant’Ana do Livramento — gestão 2025/2027.", photo: "" },
    { name: "Macarena de La Rosa Bouchacourt", role: "Advogada", credential: "OAB/RS 106.130", bio: "Advogada desde 2016, formada pelo Centro Universitário Ritter dos Reis — UniRitter, e pós-graduada em Direito de Família e Sucessões pela Fundação Escola Superior do Ministério Público — FMP.\n\nAtualmente, é Secretária-Geral da OAB, Subseção de Sant’Ana do Livramento — gestão 2025/2027, Delegada da Caixa de Assistência dos Advogados da OAB, Subseção de Sant’Ana do Livramento — gestão 2025/2027, e Coordenadora da Comissão de Direito de Família e Sucessões da OAB, Subseção de Sant’Ana do Livramento.\n\nTambém é Presidente do Instituto Brasileiro de Direito de Família — IBDFAM, Núcleo de Sant’Ana do Livramento, e possui formação em Mediação pelo NUPEMEC.", photo: "" },
    { name: "Matheus Figueiredo Machado", role: "Advogado", credential: "OAB/RS 127.152", bio: "Advogado, formado pelo Centro Universitário da Região da Campanha — URCAMP. Pós-graduado em Direito Penal e Processual Penal pela Legale Educacional e com especialização em Direito Processual Penal pela Universidade Paulista — UNIP.", photo: "" },
  ]},
  es: { title: "Quiénes están al frente del estudio", subtitle: "Conoce a los profesionales responsables de brindar una atención técnica, cercana y cuidadosa en cada asunto.", items: [
    { name: "Daniele Dachi Simões Pires", role: "Abogada", credential: "OAB/RS 108.350", bio: "Abogada desde 2017, graduada por la Universidade da Região da Campanha — URCAMP, y posgraduada en Derecho de Familia y Sucesiones por la Facultad CERS — Complexo de Ensino Renato Saraiva.\n\nFue Consejera de la OAB, Subsección de Sant’Ana do Livramento, durante la gestión 2022/2024, y actualmente es Consejera Titular de la OAB, Subsección de Sant’Ana do Livramento, en la gestión 2025/2027.\n\nAsimismo, ejerce la función de Coordinadora de la Comisión de Derecho del Niño y del Adolescente de la OAB, Subsección de Sant’Ana do Livramento — gestión 2025/2027.", photo: "" },
    { name: "Macarena de La Rosa Bouchacourt", role: "Abogada", credential: "OAB/RS 106.130", bio: "Abogada desde 2016, graduada por el Centro Universitário Ritter dos Reis — UniRitter, y posgraduada en Derecho de Familia y Sucesiones por la Fundação Escola Superior do Ministério Público — FMP.\n\nActualmente es Secretaria General de la OAB, Subsección de Sant’Ana do Livramento — gestión 2025/2027, Delegada de la Caixa de Assistência dos Advogados de la OAB, Subsección de Sant’Ana do Livramento — gestión 2025/2027, y Coordinadora de la Comisión de Derecho de Familia y Sucesiones de la OAB, Subsección de Sant’Ana do Livramento.\n\nTambién es Presidenta del Instituto Brasileiro de Direito de Família — IBDFAM, Núcleo de Sant’Ana do Livramento, y cuenta con formación en Mediación por el NUPEMEC.", photo: "" },
    { name: "Matheus Figueiredo Machado", role: "Abogado", credential: "OAB/RS 127.152", bio: "Abogado graduado por el Centro Universitario de la Región de Campanha — URCAMP. Posgraduado en Derecho Penal y Procesal Penal por Legale Educacional y con especialización en Derecho Procesal Penal por la Universidade Paulista — UNIP.", photo: "" },
  ]},
};

function mergeProfessionals(lang: Lang, data?: ProfessionalsData, gallery: string[] = []) {
  const fallback = DEFAULTS[lang];
  const incoming = Array.isArray(data?.items) ? data.items : [];
  return {
    title: data?.title || fallback.title,
    subtitle: data?.subtitle || fallback.subtitle,
    items: fallback.items.map((item, index) => {
      const persisted = incoming[index] ?? {};
      return {
        ...item,
        ...persisted,
        bio: index < 2 ? item.bio : persisted.bio || item.bio,
        photo: persisted.photo || gallery[index] || item.photo,
      };
    }),
  };
}

export function ProfessionalsSection({ lang }: { lang: Lang }) {
  const { data: siteContent } = useSiteContent(lang);
  const raw = siteContent as any;
  const content = mergeProfessionals(lang, raw?.professionals, raw?.media?.gallery ?? []);

  return (
    <>
      <style>{`section#diferenciadores:not([data-bsp-professionals="true"]){display:none!important}`}</style>
      <section id="diferenciadores" data-bsp-professionals="true" className="border-y border-border/60 bg-[#fbf7f1] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{lang === "pt" ? "Profissionais" : "Profesionales"}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">{content.title}</h2>
            <div className="mx-auto mt-5 h-px w-24 bg-primary/35" />
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{content.subtitle}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-2">
            {content.items.map((professional, index) => (
              <article key={`${professional.name}-${index}`} className={`overflow-hidden rounded-[1.35rem] border border-[#e7ddd1] bg-white/75 shadow-[0_14px_45px_-32px_rgba(54,26,24,.35)] ${content.items.length % 2 === 1 && index === content.items.length - 1 ? "lg:col-span-2 lg:w-[calc(50%-0.75rem)] lg:min-w-[560px] lg:justify-self-center" : ""}`}>
                <div className="grid sm:grid-cols-[0.9fr_1.1fr] sm:items-stretch">
                  <div className="relative h-[330px] overflow-hidden bg-[#eee7df] sm:h-[520px]">
                    {professional.photo ? <img src={professional.photo} alt={professional.name || ""} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" /> : <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground/70">{lang === "pt" ? "Selecione uma foto no Admin" : "Selecciona una foto en Admin"}</div>}
                  </div>
                  <div className="flex flex-col justify-center p-7 sm:p-8 lg:p-9">
                    <h3 className="font-display text-3xl leading-[1.02] tracking-[-0.025em] text-[#5b1820]">{professional.name}</h3>
                    <div className="mt-4 h-px w-14 bg-[#c8a36b]" />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">{professional.role}{professional.credential ? ` · ${professional.credential}` : ""}</p>
                    <p className="mt-5 whitespace-pre-line text-sm leading-6 text-foreground/72">{professional.bio}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
