import type { Lang } from "@/lib/i18n";

type Professional = {
  name?: string;
  role?: string;
  credential?: string;
  bio?: string;
  photo?: string;
};

type ProfessionalsData = {
  title?: string;
  subtitle?: string;
  items?: Professional[];
};

const DEFAULTS: Record<Lang, Required<ProfessionalsData>> = {
  pt: {
    title: "Quem está à frente do escritório",
    subtitle: "Conheça as profissionais responsáveis pela condução técnica e próxima de cada atendimento.",
    items: [
      {
        name: "Daniele Dachi Simões Pires",
        role: "Advogada",
        credential: "OAB/RS 108.350",
        bio: "Atuação jurídica pautada pelo rigor técnico, clareza e acompanhamento individualizado de cada demanda.",
        photo: "",
      },
      {
        name: "Macarena de La Rosa Bouchacourt",
        role: "Advogada",
        credential: "OAB/RS 106.130",
        bio: "Atuação jurídica orientada pela análise cuidadosa, proximidade com o cliente e condução responsável de cada caso.",
        photo: "",
      },
    ],
  },
  es: {
    title: "Quiénes están al frente del estudio",
    subtitle: "Conoce a las profesionales responsables de una atención técnica, cercana y cuidadosa en cada asunto.",
    items: [
      {
        name: "Daniele Dachi Simões Pires",
        role: "Abogada",
        credential: "OAB/RS 108.350",
        bio: "Actuación jurídica basada en el rigor técnico, la claridad y el acompañamiento individualizado de cada asunto.",
        photo: "",
      },
      {
        name: "Macarena de La Rosa Bouchacourt",
        role: "Abogada",
        credential: "OAB/RS 106.130",
        bio: "Actuación jurídica orientada por el análisis cuidadoso, la cercanía con el cliente y la conducción responsable de cada caso.",
        photo: "",
      },
    ],
  },
};

function mergeProfessionals(lang: Lang, data?: ProfessionalsData, gallery: string[] = []) {
  const fallback = DEFAULTS[lang];
  const incoming = Array.isArray(data?.items) ? data.items : [];
  const items = fallback.items.map((item, index) => ({
    ...item,
    ...(incoming[index] ?? {}),
    photo: incoming[index]?.photo || gallery[index] || item.photo,
  }));

  return {
    title: data?.title || fallback.title,
    subtitle: data?.subtitle || fallback.subtitle,
    items,
  };
}

export function ProfessionalsSection({ lang, data, gallery = [] }: { lang: Lang; data?: ProfessionalsData; gallery?: string[] }) {
  const content = mergeProfessionals(lang, data, gallery);

  return (
    <section id="diferenciadores" className="border-y border-border/60 bg-[#fbf7f1] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{lang === "pt" ? "Profissionais" : "Profesionales"}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">{content.title}</h2>
          <div className="mx-auto mt-5 h-px w-24 bg-primary/35" />
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{content.subtitle}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-2">
          {content.items.map((professional, index) => (
            <article key={`${professional.name}-${index}`} className="overflow-hidden rounded-[1.35rem] border border-[#e7ddd1] bg-white/75 shadow-[0_14px_45px_-32px_rgba(54,26,24,.35)]">
              <div className="grid min-h-[360px] sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[330px] overflow-hidden bg-[#eee7df] sm:min-h-full">
                  {professional.photo ? (
                    <img src={professional.photo} alt={professional.name || (lang === "pt" ? "Profissional" : "Profesional")} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                      {lang === "pt" ? "Selecione uma foto no Admin" : "Selecciona una foto en Admin"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-8 lg:p-9">
                  <h3 className="font-display text-3xl leading-[1.02] tracking-[-0.025em] text-[#5b1820]">{professional.name}</h3>
                  <div className="mt-4 h-px w-14 bg-[#c8a36b]" />
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">
                    {professional.role}{professional.credential ? ` · ${professional.credential}` : ""}
                  </p>
                  <p className="mt-5 whitespace-pre-line text-sm leading-6 text-foreground/72">{professional.bio}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
