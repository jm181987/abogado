import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { usePreferredLanguage } from "@/hooks/use-language";

export function HomeLanguageSync() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { lang, setLang } = usePreferredLanguage();
  const syncing = useRef(false);

  useEffect(() => {
    if (pathname !== "/") return;

    const syncSelector = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const target = buttons.find((button) => button.textContent?.trim().toLowerCase() === lang);
      const selected = buttons.find((button) => {
        const text = button.textContent?.trim().toLowerCase();
        return (text === "es" || text === "pt") && button.className.includes("bg-foreground");
      });

      if (target && selected?.textContent?.trim().toLowerCase() !== lang) {
        syncing.current = true;
        target.click();
        queueMicrotask(() => { syncing.current = false; });
      }
    };

    syncSelector();
    const observer = new MutationObserver(syncSelector);
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      if (syncing.current) return;
      const button = (event.target as HTMLElement | null)?.closest("button");
      const value = button?.textContent?.trim().toLowerCase();
      if (value === "es" || value === "pt") setLang(value);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [lang, pathname, setLang]);

  return null;
}
