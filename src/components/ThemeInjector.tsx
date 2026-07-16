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
  return null;
}
