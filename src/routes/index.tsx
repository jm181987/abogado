import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { translations, type Lang } from "@/lib/i18n";
import heroImg from "@/assets/hero-dental.jpg";
import { BookingForm } from "@/components/BookingForm";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [lang, setLang] = useState<Lang>("es");
  const [bookingOpen, setBookingOpen] = useState(false);
  const { data: t = translations[lang] } = useSiteContent(lang);
  const openBooking = () => setBookingOpen(true);

  const phoneDigits = (t.whatsapp?.number || "5555999887766").replace(/\D/g, "");
  const WHATS = `https://api.whatsapp.com/send/?phone=${phoneDigits}`;
  const brand = t.brand ?? { name1: "Vizcaya", name2: "Salud", logoUrl: "" };
  const heroSrc = t.media?.heroImage || heroImg;
  const gallery = t.media?.gallery ?? [];


  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full backdrop-blur-md bg-background/70 border-b border-border/50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-baseline gap-1.5">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={`${brand.name1} ${brand.name2}`} className="h-9 w-auto" />
            ) : (
              <>
                <span className="font-display text-2xl font-semibold tracking-tight text-foreground">{brand.name1}</span>
                <span className="font-display text-2xl font-light italic text-primary">{brand.name2}</span>
              </>
            )}
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#inicio" className="hover:text-primary transition">{t.nav.home}</a>
            <a href="#planes" className="hover:text-primary transition">{t.nav.plans}</a>
            <a href="#nosotros" className="hover:text-primary transition">{t.nav.about}</a>
            <a href="#diferenciadores" className="hover:text-primary transition">{t.nav.diff}</a>
            <a href="#contacto" className="hover:text-primary transition">{t.nav.contact}</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-full border border-border p-0.5 text-xs">
              <button
                onClick={() => setLang("es")}
                className={`rounded-full px-3 py-1 transition ${lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang("pt")}
                className={`rounded-full px-3 py-1 transition ${lang === "pt" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                PT
              </button>
            </div>
            <button
              onClick={openBooking}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              {t.nav.cta}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile lang toggle */}
      <div className="sm:hidden fixed top-20 right-4 z-40 flex items-center rounded-full border border-border bg-background/90 backdrop-blur p-0.5 text-xs shadow">
        <button onClick={() => setLang("es")} className={`rounded-full px-2.5 py-1 ${lang === "es" ? "bg-primary text-primary-foreground" : ""}`}>ES</button>
        <button onClick={() => setLang("pt")} className={`rounded-full px-2.5 py-1 ${lang === "pt" ? "bg-primary text-primary-foreground" : ""}`}>PT</button>
      </div>

      {/* Hero */}
      <section id="inicio" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroSrc} alt="Clínica Vizcaya Salud" className="h-full w-full object-cover" width={1600} height={1200} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">{t.hero.badge}</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight text-foreground">
              {t.hero.title1}{" "}
              <span className="italic text-primary">{t.hero.title2}</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-lg leading-relaxed">{t.hero.desc}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#planes" className="rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background hover:bg-primary transition">
                {t.hero.ctaPlans}
              </a>
              <a href={WHATS} target="_blank" rel="noreferrer" className="rounded-full border border-foreground/30 px-7 py-3.5 text-sm font-medium hover:bg-foreground hover:text-background transition">
                {t.hero.ctaWhats}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="nosotros" className="py-24 md:py-32 bg-muted/40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">{t.about.kicker}</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight max-w-3xl">{t.about.title}</h2>
          <p className="mt-8 max-w-3xl text-lg text-muted-foreground leading-relaxed">{t.about.body}</p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { t: t.about.mission, d: t.about.missionBody },
              { t: t.about.vision, d: t.about.visionBody },
              { t: t.about.philosophy, d: t.about.philosophyBody },
            ].map((item, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-8">
                <div className="h-1 w-10 bg-primary rounded-full mb-6" />
                <h3 className="font-display text-2xl mb-3">{item.t}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planes" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">{t.plans.kicker}</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">{t.plans.title}</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">{t.plans.subtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {t.plans.items.map((plan, i) => {
              const popular = "popular" in plan && plan.popular;
              return (
                <div
                  key={i}
                  className={`relative rounded-3xl border p-7 flex flex-col ${
                    popular
                      ? "border-primary bg-primary/5 shadow-xl scale-[1.02]"
                      : "border-border bg-card hover:border-primary/40 transition"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                      {t.plans.popular}
                    </span>
                  )}
                  <h3 className="font-display text-2xl">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.age}</p>

                  <ul className="mt-6 space-y-2.5 text-sm flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl">{plan.price}</span>
                      <span className="text-sm line-through text-muted-foreground">{plan.old}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.plans.perYear}</p>
                    <a
                      href={WHATS}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-5 block text-center rounded-full py-2.5 text-sm font-medium transition ${
                        popular
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border border-foreground/20 hover:bg-foreground hover:text-background"
                      }`}
                    >
                      {t.plans.consult}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center mt-10 text-sm text-muted-foreground">{t.plans.footnote}</p>
        </div>
      </section>

      {/* Diferenciadores */}
      <section id="diferenciadores" className="py-24 md:py-32 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-secondary mb-4">{t.diff.kicker}</p>
          <div className="grid md:grid-cols-2 gap-12 items-end mb-16">
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">{t.diff.title}</h2>
            <p className="text-background/70 leading-relaxed">{t.diff.subtitle}</p>
          </div>
          <div className="grid gap-px bg-background/10 sm:grid-cols-2 lg:grid-cols-3 rounded-3xl overflow-hidden border border-background/10">
            {t.diff.items.map((item, i) => (
              <div key={i} className="bg-foreground p-8 hover:bg-background/5 transition">
                <span className="font-display text-4xl text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-xl mt-4 mb-2">{item.t}</h3>
                <p className="text-sm text-background/60 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking modal */}
      <BookingForm open={bookingOpen} onClose={() => setBookingOpen(false)} />

      {/* Gallery (opcional, gestionada desde admin) */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-20 md:py-28 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Galería</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-10">Nuestro consultorio</h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {gallery.map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy"
                  className="w-full aspect-square object-cover rounded-2xl border border-border" />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Contact */}
      <section id="contacto" className="py-24 md:py-32">

        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">{t.contact.kicker}</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight mb-16">{t.contact.title}</h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-display text-xl mb-3">{t.contact.location}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t.contact.address1}<br />
                {t.contact.address2}<br />
                <span className="text-xs">{t.contact.parking}</span>
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl mb-3">{t.contact.howto}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t.contact.howto1}<br />
                {t.contact.howto2}<br />
                {t.contact.howto3}
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl mb-3">{t.contact.hours}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t.contact.hours1}<br />
                {t.contact.hours2}<br />
                <span className="text-xs">{t.contact.hours3}</span>
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl mb-3">{t.contact.whats}</h3>
              <a href={WHATS} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">
                {t.whatsapp?.display || "+55 55 99988 7766"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-display italic">{brand.name1} {brand.name2}</span>
          <span>{t.footer}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={WHATS}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-110 transition"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2.1-.2-.5-.5-.5-.7-.5H8c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
      </a>
    </div>
  );
}
