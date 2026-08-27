import { useEffect } from "react";
import { professionalContactCopy, type ProfessionalContactLang } from "@/components/ProfessionalContacts.i18n";

const PROFESSIONALS = [
  { name: "Dra. Macarena Bouchacourt", credential: "OAB/RS 106.130", href: "https://wa.me/5551993254208" },
  { name: "Dra. Daniele Simões Pires", credential: "OAB/RS 108.350", href: "https://wa.me/5555984388396" },
] as const;

function detectLanguage(): ProfessionalContactLang {
  const selected = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => {
      const text = button.textContent?.trim().toLowerCase();
      return (text === "es" || text === "pt") && button.className.includes("bg-foreground");
    });
  return selected?.textContent?.trim().toLowerCase() === "pt" ? "pt" : "es";
}

function professionalCard(name: string, credential: string, href: string, lang: ProfessionalContactLang) {
  const copySet = professionalContactCopy[lang];
  const card = document.createElement("a");
  card.href = href;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.className = "group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg";
  card.setAttribute("aria-label", copySet.aria(name));

  const copy = document.createElement("span");
  copy.className = "min-w-0";
  copy.innerHTML = `<strong class="block text-sm font-semibold text-foreground">${name}</strong>${credential ? `<span class="mt-0.5 block text-[11px] font-medium tracking-wide text-foreground/60">${credential}</span>` : ""}<span class="mt-1 block text-xs text-muted-foreground">${copySet.direct}</span>`;

  const action = document.createElement("span");
  action.className = "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground";
  action.textContent = copySet.action;

  card.append(copy, action);
  return card;
}

export function ProfessionalContacts() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    let currentLang: ProfessionalContactLang | null = null;

    const render = () => {
      const lang = detectLanguage();
      if (lang === currentLang && document.querySelector("[data-professional-contacts='true']")) return;
      currentLang = lang;
      const copySet = professionalContactCopy[lang];

      document.querySelector("[data-professional-contacts='true']")?.remove();

      const contact = document.querySelector<HTMLElement>("#contacto > div");
      if (contact) {
        const block = document.createElement("div");
        block.dataset.professionalContacts = "true";
        block.className = "mt-6 rounded-[2rem] border border-border bg-muted/25 p-5 sm:p-7";

        const intro = document.createElement("div");
        intro.className = "mb-5";
        intro.innerHTML = `<p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">${copySet.kicker}</p><h3 class="mt-2 font-display text-2xl text-foreground sm:text-3xl">${copySet.title}</h3><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">${copySet.description}</p>`;

        const grid = document.createElement("div");
        grid.className = "grid gap-3 md:grid-cols-2";
        PROFESSIONALS.forEach(({ name, credential, href }) => grid.appendChild(professionalCard(name, credential, href, lang)));
        block.append(intro, grid);
        contact.appendChild(block);
      }
    };

    render();
    const observer = new MutationObserver(render);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    const onLanguageClick = (event: Event) => {
      const button = (event.target as HTMLElement | null)?.closest("button");
      const text = button?.textContent?.trim().toLowerCase();
      if (text === "es" || text === "pt") window.setTimeout(render, 0);
    };
    document.addEventListener("click", onLanguageClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onLanguageClick, true);
      document.querySelector("[data-professional-contacts='true']")?.remove();
    };
  }, []);

  return null;
}
