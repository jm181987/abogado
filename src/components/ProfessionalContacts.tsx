import { useEffect } from "react";
import { professionalContactCopy, type ProfessionalContactLang } from "@/components/ProfessionalContacts.i18n";

const PROFESSIONALS = [
  { name: "Dra. Macarena Bouchacourt", href: "https://wa.me/5551993254208" },
  { name: "Dra. Daniele Simões Pires", href: "https://wa.me/5555984388396" },
  { name: "Dr. Matheus Figueiredo", href: "https://wa.me/5555996378776" },
] as const;

function detectLanguage(): ProfessionalContactLang {
  const selected = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => {
      const text = button.textContent?.trim().toLowerCase();
      return (text === "es" || text === "pt") && button.className.includes("bg-foreground");
    });
  return selected?.textContent?.trim().toLowerCase() === "pt" ? "pt" : "es";
}

function professionalCard(name: string, href: string, lang: ProfessionalContactLang) {
  const copySet = professionalContactCopy[lang];
  const card = document.createElement("a");
  card.href = href;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.className = "group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg";
  card.setAttribute("aria-label", copySet.aria(name));

  const copy = document.createElement("span");
  copy.className = "min-w-0";
  copy.innerHTML = `<strong class="block text-sm font-semibold text-foreground">${name}</strong><span class="mt-1 block text-xs text-muted-foreground">${copySet.direct}</span>`;

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
      document.querySelector("[data-professional-footer='true']")?.remove();

      const contact = document.querySelector<HTMLElement>("#contacto > div");
      if (contact) {
        const block = document.createElement("div");
        block.dataset.professionalContacts = "true";
        block.className = "mt-6 rounded-[2rem] border border-border bg-muted/25 p-5 sm:p-7";

        const intro = document.createElement("div");
        intro.className = "mb-5";
        intro.innerHTML = `<p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">${copySet.kicker}</p><h3 class="mt-2 font-display text-2xl text-foreground sm:text-3xl">${copySet.title}</h3><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">${copySet.description}</p>`;

        const grid = document.createElement("div");
        grid.className = "grid gap-3 md:grid-cols-3";
        PROFESSIONALS.forEach(({ name, href }) => grid.appendChild(professionalCard(name, href, lang)));
        block.append(intro, grid);
        contact.appendChild(block);
      }

      const footer = document.querySelector<HTMLElement>("footer > div");
      if (footer) {
        const links = document.createElement("div");
        links.dataset.professionalFooter = "true";
        links.className = "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs";
        PROFESSIONALS.forEach(({ name, href }) => {
          const link = document.createElement("a");
          link.href = href;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.className = "font-medium text-foreground/65 transition hover:text-primary";
          link.textContent = name.replace(/^Dra?\.\s/, "");
          link.setAttribute("aria-label", copySet.footerAria(name));
          links.appendChild(link);
        });
        footer.insertBefore(links, footer.lastElementChild);
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
      document.querySelector("[data-professional-footer='true']")?.remove();
    };
  }, []);

  return null;
}
