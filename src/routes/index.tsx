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
import { translations, type Lang } from "@/lib/i18n";
import heroImg from "@/assets/hero-law.jpg";
import { BookingForm } from "@/components/BookingForm";
import { useSiteContent } from "@/lib/site-content";
import { Reveal } from "@/components/Reveal";
import { ThemeInjector } from "@/components/ThemeInjector";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [lang, setLang] = useState<Lang>("es");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: t = translations[lang] } = useSiteContent(lang);

  const phoneDigits = (t.whatsapp?.number || "").replace(/\D/g, "");
  const WHATS = phoneDigits
    ? `https://api.whatsapp.com/send/?phone=${phoneDigits}`
    : "#contacto";
  const brand = t.brand ?? {
    name1: "Estudio",
    name2: "Jurídico",
    logoUrl: "",
  };
  const heroSrc = t.media?.heroImage || heroImg;
  const hasCustomHero = Boolean(t.media?.heroImage);
  const isTransparentHero = hasCustomHero && /\.png(\?|$)/i.test(heroSrc);
  const gallery = t.media?.gallery ?? [];
  const navItems = [
    ["#inicio", t.nav.home],
    ["#planes", t.nav.plans],
    ["#nosotros", t.nav.about],
    ["#diferenciadores", t.nav.diff],
    ["#contacto", t.nav.contact],
  ] as const;

  const trustItems = [
    { icon: ShieldCheck, title: t.diff.items[0]?.t, text: t.diff.items[0]?.d },
    { icon: Languages, title: t.diff.items[1]?.t, text: t.diff.items[1]?.d },
    { icon: Scale, title: t.diff.items[4]?.t, text: t.diff.items[4]?.d },
  ];

  const closeMenu = () => setMenuOpen(false);
  const openBooking = () => {
    setMenuOpen(false);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ThemeInjector theme={(t as any).theme} />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6">
          <a href="#inicio" onClick={closeMenu} className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-primary/25 bg-primary/8 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <Scale className="size-5" strokeWidth={1.7} />
            </span>
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={`${brand.name1} ${brand.name2}`}
                className="h-9 w-auto"
              />
            ) : (
              <span className="leading-none">
                <span className="block font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  {brand.name1}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-primary sm:text-[11px]">
                  {brand.name2}
                </span>
              </span>
            )}
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="nav-link text-[13px] font-medium text-foreground/70 transition hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center rounded-full border border-border bg-card/70 p-1 text-xs">
              {(["es", "pt"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setLang(item)}
                  className={`rounded-full px-3 py-1.5 font-semibold uppercase transition ${
                    lang === item
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={openBooking}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t.nav.cta}
              <ArrowRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground sm:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-border bg-background px-5 pb-6 pt-4 shadow-xl sm:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-1">
                {navItems.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium hover:bg-muted"
                  >
                    {label}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <div className="flex flex-1 items-center rounded-full border border-border p-1 text-xs">
                  {(["es", "pt"] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setLang(item)}
                      className={`flex-1 rounded-full py-2 font-semibold uppercase ${
                        lang === item
                          ? "bg-foreground text-background"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  onClick={openBooking}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {t.nav.cta}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section
          id="inicio"
          className="relative isolate min-h-[760px] overflow-hidden pb-16 pt-32 sm:pt-36 lg:flex lg:min-h-[820px] lg:items-center lg:pb-24 lg:pt-28"
        >
          <div className="absolute inset-0 -z-20">
            {isTransparentHero ? (
              <>
                <div className="absolute inset-0 bg-background" />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-8 right-0 hidden w-[52%] bg-contain bg-center bg-no-repeat opacity-95 md:block"
                  style={{ backgroundImage: `url(${heroSrc})` }}
                />
              </>
            ) : (
              <>
                <img
                  src={heroSrc}
                  alt="Estudio jurídico"
                  className="h-full w-full object-cover object-center"
                  width={1600}
                  height={1200}
                />
                <div
                  className={`absolute inset-0 ${
                    hasCustomHero
                      ? "bg-gradient-to-r from-background via-background/82 to-background/35"
                      : "bg-gradient-to-r from-background via-background/92 to-background/55"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              </>
            )}
          </div>
          <div className="absolute -left-36 top-28 -z-10 size-[420px] rounded-full bg-primary/10 blur-3xl" />

          <div className="mx-auto w-full max-w-7xl px-5 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70 backdrop-blur sm:text-xs">
                <span className="size-1.5 rounded-full bg-primary" />
                {t.hero.badge}
              </div>

              <h1 className="max-w-3xl font-display text-[3.25rem] font-medium leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[5.25rem]">
                {t.hero.title1}{" "}
                <span className="italic text-primary">{t.hero.title2}</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-foreground/68 sm:text-lg sm:leading-8">
                {t.hero.desc}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={openBooking}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {t.nav.cta}
                  <ArrowRight className="size-4" />
                </button>
                <a
                  href={WHATS}
                  target={phoneDigits ? "_blank" : undefined}
                  rel={phoneDigits ? "noreferrer" : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-background/65 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-foreground/40 hover:bg-background"
                >
                  <MessageCircle className="size-4" />
                  {t.hero.ctaWhats}
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-foreground/65 sm:text-sm">
                {t.diff.items.slice(0, 3).map((item) => (
                  <span key={item.t} className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-primary/12 text-primary">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {item.t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-4 pb-8 sm:-mt-10 sm:pb-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-[0_24px_70px_-30px_rgba(0,0,0,.28)] backdrop-blur md:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title || index}
                  className={`flex gap-4 p-6 sm:p-7 ${
                    index < trustItems.length - 1
                      ? "border-b border-border md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="nosotros" className="py-20 sm:py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t.about.kicker}
              </p>
              <h2 className="max-w-xl font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                {t.about.title}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {t.about.body}
              </p>
              <button
                onClick={openBooking}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
              >
                {t.nav.cta}
                <ArrowRight className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: t.about.mission, body: t.about.missionBody, number: "01" },
                { title: t.about.vision, body: t.about.visionBody, number: "02" },
                { title: t.about.philosophy, body: t.about.philosophyBody, number: "03" },
              ].map((item, index) => (
                <Reveal
                  key={item.title}
                  delay={index * 80}
                  className={`rounded-[1.75rem] border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg ${
                    index === 2 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-primary">
                      {item.number}
                    </span>
                    <Scale className="size-5 text-primary/55" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-8 font-display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="planes" className="border-y border-border/70 bg-muted/35 py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t.plans.kicker}
                </p>
                <h2 className="font-display text-4xl tracking-[-0.03em] sm:text-5xl">
                  {t.plans.title}
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">
                {t.plans.subtitle}
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {t.plans.items.map((plan, index) => {
                const popular = "popular" in plan && plan.popular;
                return (
                  <Reveal
                    key={plan.name}
                    delay={index * 70}
                    className={`group relative flex min-h-[490px] flex-col overflow-hidden rounded-[1.75rem] border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      popular
                        ? "border-primary/60 shadow-lg shadow-primary/8"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {popular && (
                      <div className="absolute inset-x-0 top-0 bg-primary px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
                        {t.plans.popular}
                      </div>
                    )}
                    <div className={popular ? "pt-5" : ""}>
                      <span className="text-xs font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-5 font-display text-2xl leading-tight">{plan.name}</h3>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                        {plan.age}
                      </p>
                    </div>

                    <ul className="mt-7 flex-1 space-y-3 border-t border-border pt-6 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-3 leading-5 text-foreground/75">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 border-t border-border pt-6">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl">{plan.price}</span>
                        {plan.old && (
                          <span className="text-sm text-muted-foreground line-through">{plan.old}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.plans.perYear}</p>
                      <a
                        href={WHATS}
                        target={phoneDigits ? "_blank" : undefined}
                        rel={phoneDigits ? "noreferrer" : undefined}
                        className={`mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                          popular
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        {t.plans.consult}
                        <ArrowRight className="size-4" />
                      </a>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-muted-foreground sm:text-sm">
              {t.plans.footnote}
            </p>
          </div>
        </section>

        <section id="diferenciadores" className="relative overflow-hidden bg-foreground py-20 text-background sm:py-24 lg:py-32">
          <div className="absolute -right-40 top-0 size-[500px] rounded-full bg-primary/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t.diff.kicker}
                </p>
                <h2 className="max-w-xl font-display text-4xl tracking-[-0.03em] sm:text-5xl">
                  {t.diff.title}
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-background/65 lg:justify-self-end">
                {t.diff.subtitle}
              </p>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.diff.items.map((item, index) => (
                <Reveal
                  key={item.t}
                  delay={index * 60}
                  className="rounded-[1.5rem] border border-background/10 bg-background/[0.045] p-6 transition hover:border-primary/30 hover:bg-background/[0.075]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <ShieldCheck className="size-5 text-background/35" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-7 font-display text-xl">{item.t}</h3>
                  <p className="mt-2 text-sm leading-6 text-background/60">{item.d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {gallery.length > 0 && (
          <section id="galeria" className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {lang === "es" ? "Nuestro espacio" : "Nosso espaço"}
              </p>
              <h2 className="mb-10 font-display text-4xl tracking-[-0.03em] sm:text-5xl">
                {lang === "es" ? "Un entorno profesional y cercano" : "Um ambiente profissional e acolhedor"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {gallery.map((url, index) => (
                  <img
                    key={url}
                    src={url}
                    alt={`${lang === "es" ? "Estudio jurídico" : "Escritório de advocacia"} ${index + 1}`}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-[1.5rem] border border-border object-cover shadow-sm"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contacto" className="py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-foreground/5">
              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                <div className="bg-primary p-8 text-primary-foreground sm:p-10 lg:p-12">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
                    {t.contact.kicker}
                  </p>
                  <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                    {t.contact.title}
                  </h2>
                  <p className="mt-6 max-w-md text-sm leading-6 text-primary-foreground/75 sm:text-base">
                    {lang === "es"
                      ? "Cuéntanos brevemente tu situación. Coordinamos una consulta para analizarla con claridad y confidencialidad."
                      : "Conte-nos brevemente sua situação. Agendamos uma consulta para analisá-la com clareza e confidencialidade."}
                  </p>
                  <button
                    onClick={openBooking}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
                  >
                    {t.nav.cta}
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {[
                    {
                      icon: MapPin,
                      title: t.contact.location,
                      body: (
                        <>
                          {t.contact.address1}<br />
                          {t.contact.address2}<br />
                          <span className="mt-2 inline-block text-xs">{t.contact.parking}</span>
                        </>
                      ),
                    },
                    {
                      icon: ArrowRight,
                      title: t.contact.howto,
                      body: (
                        <>
                          {t.contact.howto1}<br />
                          {t.contact.howto2}<br />
                          {t.contact.howto3}
                        </>
                      ),
                    },
                    {
                      icon: Clock3,
                      title: t.contact.hours,
                      body: (
                        <>
                          {t.contact.hours1}<br />
                          {t.contact.hours2}<br />
                          <span className="mt-2 inline-block text-xs">{t.contact.hours3}</span>
                        </>
                      ),
                    },
                    {
                      icon: MessageCircle,
                      title: t.contact.whats,
                      body: phoneDigits ? (
                        <a
                          href={WHATS}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          {t.whatsapp?.display || t.hero.ctaWhats}
                        </a>
                      ) : (
                        <span>{t.hero.ctaWhats}</span>
                      ),
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="bg-card p-7 sm:p-8">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" strokeWidth={1.7} />
                      </span>
                      <h3 className="mt-5 font-display text-xl">{title}</h3>
                      <div className="mt-3 text-sm leading-6 text-muted-foreground">{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            <span>{t.footer}</span>
          </div>
          <a href="#inicio" className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60 hover:text-primary">
            {lang === "es" ? "Volver al inicio" : "Voltar ao início"}
          </a>
        </div>
      </footer>

      <BookingForm open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
