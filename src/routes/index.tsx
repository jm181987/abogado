import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Languages,
  MapPin,
  Menu,
  MessageCircle,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { translations } from "@/lib/i18n";
import heroImg from "@/assets/hero-law.jpg";
import { useSiteContent } from "@/lib/site-content";
import { Reveal } from "@/components/Reveal";
import { ThemeInjector } from "@/components/ThemeInjector";
import { HeroMedia } from "@/components/HeroMedia";
import { OfficeSection } from "@/components/OfficeSection";
import { GalleryCarousel } from "@/components/GalleryCarousel";
import { usePreferredLanguage } from "@/hooks/use-language";

const SITE_URL = "https://bspadvogados.vercel.app";
const SOCIAL_TITLE = "Bouchacourt · Simões Pires | Advocacia & Assessoria Jurídica";
const SOCIAL_DESCRIPTION = "Assessoria jurídica ética e estratégica para pessoas, famílias e empresas no Brasil.";
const SOCIAL_IMAGE = `${SITE_URL}/og-social.jpg`;

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: SOCIAL_TITLE },
      { name: "description", content: SOCIAL_DESCRIPTION },
      { property: "og:title", content: SOCIAL_TITLE },
      { property: "og:description", content: SOCIAL_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: "Bouchacourt · Simões Pires" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:locale:alternate", content: "es_ES" },
      { property: "og:image", content: SOCIAL_IMAGE },
      { property: "og:image:secure_url", content: SOCIAL_IMAGE },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Bouchacourt Simões Pires · Advocacia e Assessoria Jurídica" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SOCIAL_TITLE },
      { name: "twitter:description", content: SOCIAL_DESCRIPTION },
      { name: "twitter:image", content: SOCIAL_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
});

function Index() {
  const { lang, setLang } = usePreferredLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: t = translations[lang] } = useSiteContent(lang);

  const phoneDigits = (t.whatsapp?.number || "").replace(/\D/g, "");
  const WHATS = phoneDigits ? `https://api.whatsapp.com/send/?phone=${phoneDigits}` : "#contacto";
  const contactCta = lang === "pt" ? "Contato" : "Contacto";
  const brand = { ...(t.brand ?? {}), name1: "Bouchacourt", name2: "Simões Pires", logoUrl: "/navbar-logo.jpg" };
  const galleryHeroFallback = t.media?.gallery?.[0];
  const heroSrc = t.media?.heroImage || galleryHeroFallback || heroImg;
  const gallery = t.media?.gallery ?? [];
  const navItems = lang === "pt" ? [
    ["#inicio", "Início"],
    ["#nosotros", "O Escritório"],
    ["#planes", "Áreas de Atuação"],
    ["#diferenciadores", "Profissionais"],
  ] as const : [
    ["#inicio", "Inicio"],
    ["#nosotros", "El Estudio"],
    ["#planes", "Áreas de Actuación"],
    ["#diferenciadores", "Profesionales"],
  ] as const;

  const trustItems = [
    { icon: ShieldCheck, title: t.diff.items[0]?.t, text: t.diff.items[0]?.d },
    { icon: Languages, title: t.diff.items[1]?.t, text: t.diff.items[1]?.d },
    { icon: Scale, title: t.diff.items[4]?.t, text: t.diff.items[4]?.d },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ThemeInjector theme={(t as any).theme} />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <nav className="mx-auto flex h-[92px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#inicio" onClick={closeMenu} aria-label={lang === "pt" ? "Ir ao início" : "Ir al inicio"} className="group flex min-w-0 shrink-0 items-center">
            <img src={brand.logoUrl} alt="Bouchacourt & Simões Pires Advocacia" className="h-14 w-auto max-w-[210px] object-contain sm:h-16 sm:max-w-[260px] lg:h-20 lg:max-w-[330px]" />
          </a>

          <div className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-7">
            {navItems.map(([href, label]) => (
              <a key={href} href={href} className="nav-link text-[13px] font-medium text-foreground/70 transition hover:text-foreground">{label}</a>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <div className="flex items-center rounded-full border border-border bg-card/70 p-1 text-xs">
              {(["es", "pt"] as const).map((item) => (
                <button key={item} onClick={() => setLang(item)} className={`rounded-full px-3 py-1.5 font-semibold uppercase transition ${lang === item ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{item}</button>
              ))}
            </div>
            <a href="#contacto" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              {contactCta}<ArrowRight className="size-4" />
            </a>
          </div>

          <button type="button" onClick={() => setMenuOpen(value => !value)} className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground sm:hidden" aria-label={menuOpen ? (lang === "pt" ? "Fechar menu" : "Cerrar menú") : (lang === "pt" ? "Abrir menu" : "Abrir menú")} aria-expanded={menuOpen}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-border bg-background px-5 pb-6 pt-4 shadow-xl sm:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-1">
                {navItems.map(([href, label]) => (
                  <a key={href} href={href} onClick={closeMenu} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium hover:bg-muted">{label}<ArrowRight className="size-4 text-muted-foreground" /></a>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <div className="flex flex-1 items-center rounded-full border border-border p-1 text-xs">
                  {(["es", "pt"] as const).map((item) => (
                    <button key={item} onClick={() => setLang(item)} className={`flex-1 rounded-full py-2 font-semibold uppercase ${lang === item ? "bg-foreground text-background" : "text-muted-foreground"}`}>{item}</button>
                  ))}
                </div>
                <a href="#contacto" onClick={closeMenu} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{contactCta}</a>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative isolate min-h-[760px] overflow-hidden pb-16 pt-32 sm:pt-36 lg:flex lg:min-h-[820px] lg:items-center lg:pb-24 lg:pt-28">
          <div className="absolute inset-0 z-0 overflow-hidden bg-background">
            <HeroMedia lang={lang} media={t.media as any} fallbackSrc={heroSrc} />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/82 to-background/35 lg:hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent lg:hidden" />
          </div>
          <div className="absolute -left-36 top-28 -z-10 size-[420px] rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70 backdrop-blur sm:text-xs">
                <span className="size-1.5 rounded-full bg-primary" />{t.hero.badge}
              </div>
              <h1 className="max-w-3xl font-display text-[3.25rem] font-medium leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[5.25rem]">{t.hero.title1} <span className="italic text-primary">{t.hero.title2}</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-foreground/68 sm:text-lg sm:leading-8">{t.hero.desc}</p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#contacto" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:shadow-xl">
                  {contactCta}<ArrowRight className="size-4" />
                </a>
                <a href={WHATS} target={phoneDigits ? "_blank" : undefined} rel={phoneDigits ? "noreferrer" : undefined} className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-background/65 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-foreground/40 hover:bg-background">
                  <MessageCircle className="size-4" />{t.hero.ctaWhats}
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-foreground/65 sm:text-sm">
                {t.diff.items.slice(0, 3).map(item => (
                  <span key={item.t} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-primary/12 text-primary"><Check className="size-3" strokeWidth={2.5} /></span>{item.t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-4 pb-8 sm:-mt-10 sm:pb-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-[0_24px_70px_-30px_rgba(0,0,0,.28)] backdrop-blur md:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, text }, index) => (
                <div key={title || index} className={`flex gap-4 p-6 sm:p-7 ${index < trustItems.length - 1 ? "border-b border-border md:border-b-0 md:border-r" : ""}`}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" strokeWidth={1.8} /></span>
                  <div><h2 className="text-sm font-semibold text-foreground">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OfficeSection lang={lang} about={t.about} />

        <section id="planes" className="border-y border-border/70 bg-muted/35 py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t.plans.kicker}</p><h2 className="font-display text-4xl tracking-[-0.03em] sm:text-5xl">{t.plans.title}</h2></div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">{t.plans.subtitle}</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {t.plans.items.map((plan, index) => {
                const popular = "popular" in plan && plan.popular;
                return (
                  <Reveal key={plan.name} delay={index * 70} className={`group relative flex min-h-[490px] flex-col overflow-hidden rounded-[1.75rem] border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${popular ? "border-primary/60 shadow-lg shadow-primary/8" : "border-border hover:border-primary/30"}`}>
                    {popular && <div className="absolute inset-x-0 top-0 bg-primary px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">{t.plans.popular}</div>}
                    <div className={popular ? "pt-5" : ""}><span className="text-xs font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-5 font-display text-2xl leading-tight">{plan.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{plan.age}</p></div>
                    <ul className="mt-7 flex-1 space-y-3 border-t border-border pt-6 text-sm">{plan.features.map(feature => <li key={feature} className="flex gap-3 leading-5 text-foreground/75"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}</ul>
                    <div className="mt-7 border-t border-border pt-6">
                      <div className="flex items-baseline gap-2"><span className="font-display text-3xl">{plan.price}</span>{plan.old && <span className="text-sm text-muted-foreground line-through">{plan.old}</span>}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.plans.perYear}</p>
                      <a href={WHATS} target={phoneDigits ? "_blank" : undefined} rel={phoneDigits ? "noreferrer" : undefined} className={`mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${popular ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"}`}>{t.plans.consult}<ArrowRight className="size-4" /></a>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-muted-foreground sm:text-sm">{t.plans.footnote}</p>
          </div>
        </section>

        <section id="diferenciadores" className="relative overflow-hidden bg-foreground py-20 text-background sm:py-24 lg:py-32">
          <div className="absolute -right-40 top-0 size-[500px] rounded-full bg-primary/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
              <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t.diff.kicker}</p><h2 className="max-w-xl font-display text-4xl tracking-[-0.03em] sm:text-5xl">{t.diff.title}</h2></div>
              <p className="max-w-xl text-base leading-7 text-background/65 lg:justify-self-end">{t.diff.subtitle}</p>
            </div>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.diff.items.map((item, index) => (
                <Reveal key={item.t} delay={index * 60} className="rounded-[1.5rem] border border-background/10 bg-background/[0.045] p-6 transition hover:border-primary/30 hover:bg-background/[0.075]">
                  <div className="flex items-center justify-between"><span className="font-display text-3xl text-primary">{String(index + 1).padStart(2, "0")}</span><ShieldCheck className="size-5 text-background/35" strokeWidth={1.5} /></div>
                  <h3 className="mt-7 font-display text-xl">{item.t}</h3><p className="mt-2 text-sm leading-6 text-background/60">{item.d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <GalleryCarousel images={gallery} lang={lang} />

        <section id="contacto" className="py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-foreground/5">
              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                <div className="bg-primary p-8 text-primary-foreground sm:p-10 lg:p-12">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">{t.contact.kicker}</p>
                  <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">{t.contact.title}</h2>
                  <p className="mt-6 max-w-md whitespace-pre-line text-sm leading-6 text-primary-foreground/75 sm:text-base">{lang === "es" ? "El estudio de Abogacía Bouchacourt & Simões Pires no solicita, mediante mensajes de celular o aplicaciones de comunicación, pagos, transferencias, depósitos, costas judiciales ni ningún importe relacionado con procesos en curso.\n\nEn caso de duda o de recibir cualquier mensaje sospechoso en nombre del estudio o de sus abogados, no realice pagos y póngase inmediatamente en contacto con nosotros a través de los canales oficiales informados en este sitio." : "O escritório de Advocacia Bouchacourt & Simões Pires não solicita, por mensagens de celular ou aplicativos de comunicação, pagamentos, transferências, depósitos, custas judiciais ou quaisquer valores relacionados a processos em andamento.\n\nEm caso de dúvida ou ao receber qualquer mensagem suspeita em nome do escritório ou de seus advogados, não realize pagamentos e entre imediatamente em contato conosco pelos canais oficiais informados neste site."}</p>
                  <a href={WHATS} target={phoneDigits ? "_blank" : undefined} rel={phoneDigits ? "noreferrer" : undefined} className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">{contactCta}<ArrowRight className="size-4" /></a>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {[
                    { icon: MapPin, title: t.contact.location, body: <>{t.contact.address1}<br />{t.contact.address2}<br /><span className="mt-2 inline-block text-xs">{t.contact.parking}</span></> },
                    { icon: ArrowRight, title: t.contact.howto, body: <>{t.contact.howto1}<br />{t.contact.howto2}<br />{t.contact.howto3}</> },
                    { icon: Clock3, title: t.contact.hours, body: <>{t.contact.hours1}<br />{t.contact.hours2}<br /><span className="mt-2 inline-block text-xs">{t.contact.hours3}</span></> },
                    { icon: MessageCircle, title: t.contact.whats, body: phoneDigits ? <a href={WHATS} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{t.whatsapp?.display || t.hero.ctaWhats}</a> : <span>{t.hero.ctaWhats}</span> },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="bg-card p-7 sm:p-8"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" strokeWidth={1.7} /></span><h3 className="mt-5 font-display text-xl">{title}</h3><div className="mt-3 text-sm leading-6 text-muted-foreground">{body}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
