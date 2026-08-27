import { useEffect } from "react";

const PROFESSIONALS = [
  { name: "Dra. Macarena Bouchacourt", href: "https://wa.me/5551993254208" },
  { name: "Dra. Daniele Simões Pires", href: "https://wa.me/5555984388396" },
  { name: "Dr. Matheus Figueiredo", href: "https://wa.me/5555996378776" },
] as const;

function professionalCard(name: string, href: string) {
  const card = document.createElement("a");
  card.href = href;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.className = "group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg";
  card.setAttribute("aria-label", `Contactar por WhatsApp con ${name}`);

  const copy = document.createElement("span");
  copy.className = "min-w-0";
  copy.innerHTML = `<strong class="block text-sm font-semibold text-foreground">${name}</strong><span class="mt-1 block text-xs text-muted-foreground">WhatsApp directo</span>`;

  const action = document.createElement("span");
  action.className = "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground";
  action.textContent = "Contactar";

  card.append(copy, action);
  return card;
}

export function ProfessionalContacts() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const mount = () => {
      const contact = document.querySelector<HTMLElement>("#contacto > div");
      if (contact && !document.querySelector("[data-professional-contacts='true']")) {
        const block = document.createElement("div");
        block.dataset.professionalContacts = "true";
        block.className = "mt-6 rounded-[2rem] border border-border bg-muted/25 p-5 sm:p-7";

        const intro = document.createElement("div");
        intro.className = "mb-5";
        intro.innerHTML = `<p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Equipo profesional</p><h3 class="mt-2 font-display text-2xl text-foreground sm:text-3xl">Contacto directo por WhatsApp</h3><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Elige con quién deseas comunicarte. Cada botón abre una conversación directa con el profesional seleccionado.</p>`;

        const grid = document.createElement("div");
        grid.className = "grid gap-3 md:grid-cols-3";
        PROFESSIONALS.forEach(({ name, href }) => grid.appendChild(professionalCard(name, href)));
        block.append(intro, grid);
        contact.appendChild(block);
      }

      const footer = document.querySelector<HTMLElement>("footer > div");
      if (footer && !document.querySelector("[data-professional-footer='true']")) {
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
          link.setAttribute("aria-label", `WhatsApp de ${name}`);
          links.appendChild(link);
        });
        footer.insertBefore(links, footer.lastElementChild);
      }
    };

    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelector("[data-professional-contacts='true']")?.remove();
      document.querySelector("[data-professional-footer='true']")?.remove();
    };
  }, []);

  return null;
}
