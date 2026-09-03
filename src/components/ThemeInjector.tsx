import { useEffect } from "react";

type ThemeColors = {
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
};

const MAP: Record<keyof ThemeColors, string> = {
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  accent: "--accent",
  background: "--background",
  foreground: "--foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
};

const TRUST_COPY = {
  pt: {
    firstTitle: "Advocacia com atuação multidisciplinar",
    firstText: "Atuação integrada em diferentes áreas do Direito, com soluções jurídicas completas e alinhadas às necessidades de cada cliente.",
    thirdTitle: "Atuação no Brasil",
    thirdText: "Atuação jurídica em todo o território brasileiro, com atendimento online a clientes residentes no exterior.",
  },
  es: {
    firstTitle: "Abogacía con actuación multidisciplinaria",
    firstText: "Actuación integrada en diferentes áreas del Derecho, con soluciones jurídicas completas y alineadas con las necesidades de cada cliente.",
    thirdTitle: "Actuación en Brasil",
    thirdText: "Actuación jurídica en todo el territorio brasileño, con atención online a clientes residentes en el exterior.",
  },
} as const;

export function ThemeInjector({ theme }: { theme?: ThemeColors | null }) {
  useEffect(() => {
    const root = document.documentElement;
    const applied: string[] = [];
    if (theme) {
      for (const k of Object.keys(MAP) as (keyof ThemeColors)[]) {
        const v = theme[k];
        if (v && typeof v === "string" && v.trim()) {
          root.style.setProperty(MAP[k], v.trim());
          applied.push(MAP[k]);
          if (k === "primary") {
            root.style.setProperty("--ring", v.trim());
            applied.push("--ring");
          }
        }
      }
    }
    return () => {
      for (const p of applied) root.style.removeProperty(p);
    };
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const trustSection = document.getElementById("inicio")?.nextElementSibling;
    if (!(trustSection instanceof HTMLElement)) return;

    let frame = 0;
    const applyTrustCopy = () => {
      const headings = trustSection.querySelectorAll<HTMLHeadingElement>("h2");
      const paragraphs = trustSection.querySelectorAll<HTMLParagraphElement>("p");
      if (headings.length < 3 || paragraphs.length < 3) return;

      const copy = root.lang.toLowerCase().startsWith("pt") ? TRUST_COPY.pt : TRUST_COPY.es;
      if (headings[0].textContent !== copy.firstTitle) headings[0].textContent = copy.firstTitle;
      if (paragraphs[0].textContent !== copy.firstText) paragraphs[0].textContent = copy.firstText;
      if (headings[2].textContent !== copy.thirdTitle) headings[2].textContent = copy.thirdTitle;
      if (paragraphs[2].textContent !== copy.thirdText) paragraphs[2].textContent = copy.thirdText;
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyTrustCopy);
    };

    const languageObserver = new MutationObserver(schedule);
    languageObserver.observe(root, { attributes: true, attributeFilter: ["lang"] });

    const contentObserver = new MutationObserver(schedule);
    contentObserver.observe(trustSection, { subtree: true, childList: true, characterData: true });

    schedule();
    return () => {
      cancelAnimationFrame(frame);
      languageObserver.disconnect();
      contentObserver.disconnect();
    };
  }, []);

  return null;
}
