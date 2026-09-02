import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrackingAdmin } from "@/components/admin/TrackingAdmin";
import type { Lang } from "@/lib/i18n";

type TrackingConfig = {
  analyticsEnabled?: boolean;
  googleAnalyticsId?: string;
  metaPixelEnabled?: boolean;
  metaPixelId?: string;
};

type Consent = "all" | "necessary" | null;

const CONSENT_KEY = "bsp-cookie-consent:v1";
const INSTAGRAM_URL = "https://www.instagram.com/bouchacourtsimoespires/";
const INSTAGRAM_LABEL = "@bouchacourtsimoespires";
const WHATSAPP_FALLBACK_NUMBER = "5551993254208";
const WHATSAPP_FALLBACK_DISPLAY = "+55 51 99325-4208";

function getLang(): Lang {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem("abogado-language");
  return saved === "pt" ? "pt" : "es";
}

function readConsent(): Consent {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "all" || value === "necessary" ? value : null;
}

function loadGoogleAnalytics(id: string) {
  if (!id || document.querySelector(`script[data-bsp-ga="${id}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.bspGa = id;
  document.head.appendChild(script);
  (window as any).dataLayer = (window as any).dataLayer || [];
  const gtag = (...args: any[]) => (window as any).dataLayer.push(args);
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
}

function loadMetaPixel(id: string) {
  if (!id || document.querySelector(`script[data-bsp-pixel="${id}"]`)) return;
  const w = window as any;
  if (!w.fbq) {
    const fbq: any = function (...args: any[]) { fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
    w._fbq = fbq;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.dataset.bspPixel = id;
  document.head.appendChild(script);
  w.fbq("init", id);
  w.fbq("track", "PageView");
}

function appendSvg(link: HTMLAnchorElement, kind: "whatsapp" | "instagram") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("shrink-0");

  if (kind === "instagram") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "3");
    rect.setAttribute("y", "3");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "18");
    rect.setAttribute("rx", "5");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "4");
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", "17.5");
    dot.setAttribute("cy", "6.5");
    dot.setAttribute("r", "0.7");
    dot.setAttribute("fill", "currentColor");
    dot.setAttribute("stroke", "none");
    svg.append(rect, circle, dot);
  } else {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A8 8 0 1 1 21 15Z");
    const phone = document.createElementNS("http://www.w3.org/2000/svg", "path");
    phone.setAttribute("d", "M9.4 8.6c.4 2.2 1.8 3.6 4 4l1.1-1.1 1.8.8-.2 1.7c-.2.8-1 1.3-1.8 1.2-4.2-.5-7-3.3-7.5-7.5-.1-.8.4-1.6 1.2-1.8l1.7-.2.8 1.8-1.1 1.1Z");
    svg.append(path, phone);
  }

  link.appendChild(svg);
}

function makeMethodLink(kind: "whatsapp" | "instagram", href: string, label: string) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.className = "flex items-center gap-2 font-semibold text-primary transition hover:underline underline-offset-4";
  link.setAttribute("aria-label", `${kind === "whatsapp" ? "WhatsApp" : "Instagram"} ${label}`);
  appendSvg(link, kind);
  const text = document.createElement("span");
  text.textContent = label;
  link.appendChild(text);
  return link;
}

function enhanceContact() {
  if (typeof document === "undefined" || window.location.pathname !== "/") return;
  const contact = document.getElementById("contacto");
  if (!contact) return;

  const whatsappHeading = Array.from(contact.querySelectorAll<HTMLHeadingElement>("h3"))
    .find((heading) => heading.textContent?.trim().toLowerCase() === "whatsapp");
  const body = whatsappHeading?.nextElementSibling as HTMLElement | null;
  if (!body || body.querySelector('[data-bsp-contact-methods="true"]')) return;

  const existingWhatsapp = body.querySelector<HTMLAnchorElement>('a[href*="whatsapp"], a[href*="wa.me"]');
  const existingDigits = (existingWhatsapp?.textContent ?? "").replace(/\D/g, "");
  const existingLabel = existingWhatsapp?.textContent?.trim() ?? "";
  const whatsappHref = existingWhatsapp?.href || `https://wa.me/${WHATSAPP_FALLBACK_NUMBER}`;
  const whatsappLabel = existingDigits.length >= 8 ? existingLabel : WHATSAPP_FALLBACK_DISPLAY;

  // No reemplazar ni eliminar hijos renderizados por React. Hacerlo durante la
  // hidratación puede dejar al reconciliador apuntando a nodos que ya no existen
  // y provocar la pantalla de error al refrescar.
  const existingPrimary = body.firstElementChild as HTMLElement | null;
  if (existingPrimary) {
    existingPrimary.style.display = "none";
    existingPrimary.setAttribute("aria-hidden", "true");
  }

  const methods = document.createElement("div");
  methods.dataset.bspContactMethods = "true";
  methods.className = "grid gap-3";
  methods.append(
    makeMethodLink("whatsapp", whatsappHref, whatsappLabel),
    makeMethodLink("instagram", INSTAGRAM_URL, INSTAGRAM_LABEL),
  );
  body.appendChild(methods);
}

export function CookieTracking() {
  // El primer render debe ser idéntico en SSR y en el navegador. Leer localStorage
  // durante la inicialización provoca diferencias de hidratación al refrescar.
  const [lang, setLang] = useState<Lang>("es");
  const [consent, setConsent] = useState<Consent>(null);
  const [open, setOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [tracking, setTracking] = useState<TrackingConfig>({});
  const [adminTrackingOpen, setAdminTrackingOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedConsent = readConsent();
    setLang(getLang());
    setConsent(storedConsent);
    setOpen(storedConsent === null);
    setIsAdmin(window.location.pathname.startsWith("/admin"));
  }, []);

  useEffect(() => {
    const sync = () => setLang(getLang());
    const openSettings = () => { setOpen(true); setShowPolicy(false); };
    const openPolicy = () => { setOpen(true); setShowPolicy(true); };
    window.addEventListener("storage", sync);
    window.addEventListener("bsp:cookie-settings", openSettings as EventListener);
    window.addEventListener("bsp:cookie-policy", openPolicy as EventListener);
    document.addEventListener("click", sync, true);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("bsp:cookie-settings", openSettings as EventListener);
      window.removeEventListener("bsp:cookie-policy", openPolicy as EventListener);
      document.removeEventListener("click", sync, true);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    const safeEnhance = () => {
      try { enhanceContact(); } catch (error) { console.warn("[contact methods]", error); }
    };
    safeEnhance();
    const observer = new MutationObserver(safeEnhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang, isAdmin]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("site_content").select("data").eq("lang", "pt").maybeSingle();
      setTracking(((data?.data as any)?.tracking ?? {}) as TrackingConfig);
    })();
  }, []);

  useEffect(() => {
    if (consent !== "all") return;
    if (tracking.analyticsEnabled && tracking.googleAnalyticsId) loadGoogleAnalytics(tracking.googleAnalyticsId.trim());
    if (tracking.metaPixelEnabled && tracking.metaPixelId) loadMetaPixel(tracking.metaPixelId.trim());
  }, [consent, tracking]);

  const copy = useMemo(() => lang === "pt" ? {
    title: "Privacidade e cookies",
    text: "Usamos cookies necessários para o funcionamento do site. Com sua autorização, também podemos usar Google Analytics e Meta Pixel para medir acessos e melhorar nossas campanhas.",
    accept: "Aceitar todos",
    reject: "Somente necessários",
    policy: "Política de cookies",
    close: "Fechar",
    policyTitle: "Política de Cookies",
    policyBody: "Cookies necessários mantêm preferências essenciais, como o idioma escolhido. Cookies de análise e publicidade somente são ativados após seu consentimento e podem ser fornecidos pelo Google Analytics e pelo Meta Pixel quando esses serviços estiverem habilitados pelo escritório. Você pode recusar cookies não essenciais sem perder o acesso ao site e pode alterar sua escolha a qualquer momento pelo link de cookies no rodapé.",
  } : {
    title: "Privacidad y cookies",
    text: "Usamos cookies necesarios para el funcionamiento del sitio. Con tu autorización, también podemos usar Google Analytics y Meta Pixel para medir accesos y mejorar nuestras campañas.",
    accept: "Aceptar todos",
    reject: "Solo necesarios",
    policy: "Política de cookies",
    close: "Cerrar",
    policyTitle: "Política de Cookies",
    policyBody: "Las cookies necesarias mantienen preferencias esenciales, como el idioma elegido. Las cookies de análisis y publicidad solo se activan después de tu consentimiento y pueden ser provistas por Google Analytics y Meta Pixel cuando esos servicios estén habilitados por el estudio. Puedes rechazar las cookies no esenciales sin perder el acceso al sitio y cambiar tu elección en cualquier momento desde el enlace de cookies del pie de página.",
  }, [lang]);

  function choose(value: Exclude<Consent, null>) {
    const previous = consent;
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    setOpen(false);
    setShowPolicy(false);
    if (previous === "all" && value === "necessary") window.location.reload();
  }

  return (
    <>
      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => setAdminTrackingOpen(true)}
            className="fixed right-4 top-24 z-[200] min-h-12 rounded-full border border-primary-foreground/15 bg-primary px-5 text-sm font-bold text-primary-foreground shadow-2xl sm:right-6 sm:top-28"
            aria-label="Abrir Analytics y Pixel"
          >
            Analytics & Pixel
          </button>
          {adminTrackingOpen && (
            <div className="fixed inset-0 z-[220] overflow-y-auto bg-background/95 p-4 backdrop-blur sm:p-8">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Admin</p><h2 className="font-display text-2xl">Analytics & Pixel</h2></div>
                  <button type="button" onClick={() => setAdminTrackingOpen(false)} className="min-h-10 rounded-full border border-border bg-background px-4 text-xs font-semibold">{lang === "pt" ? "Fechar" : "Cerrar"}</button>
                </div>
                <TrackingAdmin lang={lang} />
              </div>
            </div>
          )}
        </>
      )}

      {!isAdmin && open && (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-5" role="dialog" aria-live="polite" aria-label={copy.title}>
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/98 p-5 shadow-2xl backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl text-foreground">{showPolicy ? copy.policyTitle : copy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{showPolicy ? copy.policyBody : copy.text}</p>
                {!showPolicy && <button type="button" onClick={() => setShowPolicy(true)} className="mt-3 text-xs font-semibold text-primary underline underline-offset-4">{copy.policy}</button>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[300px] sm:justify-end">
                {showPolicy ? <button type="button" onClick={() => setShowPolicy(false)} className="min-h-10 rounded-full border border-border px-4 text-xs font-semibold">{copy.close}</button> : <>
                  <button type="button" onClick={() => choose("necessary")} className="min-h-10 rounded-full border border-border px-4 text-xs font-semibold">{copy.reject}</button>
                  <button type="button" onClick={() => choose("all")} className="min-h-10 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">{copy.accept}</button>
                </>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}