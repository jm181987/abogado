import { MessageCircle, Scale, ShieldCheck, Users } from "lucide-react";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  about: {
    kicker?: string;
    title?: string;
    body?: string;
  };
};

const copy = {
  pt: {
    eyebrow: "O Escritório",
    title: "Advocacia multidisciplinar, com atuação próxima e responsável.",
    pillars: [
      { title: "Conhecimento técnico", text: "Estudo criterioso e atualização constante.", icon: Scale },
      { title: "Clareza", text: "Comunicação objetiva e compreensão das alternativas, riscos e caminhos jurídicos.", icon: MessageCircle },
      { title: "Proximidade", text: "Acompanhamento individualizado e comunicação direta.", icon: Users },
      { title: "Responsabilidade", text: "Atuação ética, discreta e atenta às particularidades de cada cliente.", icon: ShieldCheck },
    ],
  },
  es: {
    eyebrow: "El Estudio",
    title: "Abogacía multidisciplinaria, con una actuación cercana y responsable.",
    pillars: [
      { title: "Conocimiento técnico", text: "Estudio riguroso y actualización constante.", icon: Scale },
      { title: "Claridad", text: "Comunicación objetiva y comprensión de alternativas, riesgos y caminos jurídicos.", icon: MessageCircle },
      { title: "Proximidad", text: "Acompañamiento individualizado y comunicación directa.", icon: Users },
      { title: "Responsabilidad", text: "Actuación ética, discreta y atenta a las particularidades de cada cliente.", icon: ShieldCheck },
    ],
  },
} as const;

function splitBody(body: string) {
  const sentences = body.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) ?? [body];
  if (sentences.length < 2) return [body];
  const midpoint = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, midpoint).join(" "), sentences.slice(midpoint).join(" ")];
}

export function OfficeSection({ lang, about }: Props) {
  const current = copy[lang];
  const paragraphs = splitBody(about.body?.trim() || "");

  return (
    <section id="nosotros" className="border-y border-border/40 bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary sm:text-xs">{current.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-medium leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
            {current.title}
          </h2>
          <span aria-hidden="true" className="mx-auto mt-7 block h-px w-12 bg-primary/55" />

          <div className="mx-auto mt-8 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </div>

        <div className="mt-14 grid border-y border-border/55 sm:grid-cols-2 lg:grid-cols-4 lg:border-y-0">
          {current.pillars.map(({ title, text, icon: Icon }, index) => (
            <article
              key={title}
              className={`flex flex-col items-center px-6 py-9 text-center sm:px-8 lg:py-5 ${index > 0 ? "border-t border-border/55 sm:border-t-0 lg:border-l" : ""} ${index === 2 ? "sm:border-l" : ""}`}
            >
              <Icon className="size-9 text-primary" strokeWidth={1.55} />
              <h3 className="mt-5 font-display text-2xl leading-tight text-foreground">{title}</h3>
              <p className="mt-3 max-w-[15rem] text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
