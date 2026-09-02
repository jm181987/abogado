import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

const clamp = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.max(0, Math.min(100, number));
};

type HeroMediaState = {
  heroImage?: string;
  heroMobileImage?: string;
  gallery?: string[];
  heroPositionX?: number;
  heroPositionY?: number;
  heroMobilePositionX?: number;
  heroMobilePositionY?: number;
};

export function HeroMedia({ lang, media, fallbackSrc }: { lang: Lang; media?: HeroMediaState; fallbackSrc: string }) {
  const [authoritative, setAuthoritative] = useState<HeroMediaState | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("lang", lang)
      .maybeSingle();

    if (!error) {
      setAuthoritative((((data?.data as any)?.media ?? null) as HeroMediaState | null));
    }
  }, [lang]);

  useEffect(() => {
    let active = true;

    void supabase
      .from("site_content")
      .select("data")
      .eq("lang", lang)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setAuthoritative((((data?.data as any)?.media ?? null) as HeroMediaState | null));
      });

    const onFocus = () => { if (active) void refresh(); };
    const onPageShow = () => { if (active) void refresh(); };
    const onContentUpdated = () => { if (active) void refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "bsp:content-updated" && active) void refresh();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("bsp:content-updated", onContentUpdated as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("bsp:content-updated", onContentUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [lang, refresh]);

  useEffect(() => {
    if (!media) return;
    setAuthoritative(current => ({ ...(current ?? {}), ...media }));
  }, [media?.heroImage, media?.heroMobileImage, media?.heroPositionX, media?.heroPositionY, media?.heroMobilePositionX, media?.heroMobilePositionY, media?.gallery]);

  const finalMedia = authoritative ?? media ?? {};
  const desktopSrc = finalMedia.heroImage || finalMedia.gallery?.[0] || fallbackSrc;
  const mobileSrc = finalMedia.heroMobileImage || desktopSrc;
  const desktopX = clamp(finalMedia.heroPositionX);
  const desktopY = clamp(finalMedia.heroPositionY);
  const mobileX = clamp(finalMedia.heroMobilePositionX);
  const mobileY = clamp(finalMedia.heroMobilePositionY);

  const desktopPosition = useMemo(() => `${desktopX}% ${desktopY}%`, [desktopX, desktopY]);
  const mobilePosition = useMemo(() => `${mobileX}% ${mobileY}%`, [mobileX, mobileY]);

  return (
    <div className="absolute inset-0">
      <img
        src={mobileSrc}
        alt="Estudio jurídico"
        className="h-full w-full object-cover lg:hidden"
        style={{ objectPosition: mobilePosition }}
        width={1600}
        height={1200}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={(event) => {
          if (!event.currentTarget.dataset.fallback) {
            event.currentTarget.dataset.fallback = "true";
            event.currentTarget.src = desktopSrc;
          }
        }}
      />

      <div className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden bg-background lg:block">
        <img
          src={desktopSrc}
          alt="Estudio jurídico"
          className="h-full w-full object-cover opacity-100"
          style={{ objectPosition: desktopPosition }}
          width={1600}
          height={1200}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(event) => {
            if (!event.currentTarget.dataset.fallback) {
              event.currentTarget.dataset.fallback = "true";
              event.currentTarget.src = fallbackSrc;
            }
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-background via-background/45 to-transparent" />
      </div>
    </div>
  );
}
