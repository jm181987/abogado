import { useEffect, useMemo, useState } from "react";
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
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolved(false);

    void supabase
      .from("site_content")
      .select("data")
      .eq("lang", lang)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAuthoritative((((data?.data as any)?.media ?? null) as HeroMediaState | null));
        setResolved(true);
      }, () => {
        if (!cancelled) setResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

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
    <div className="absolute inset-0" style={{ opacity: resolved ? 1 : 0 }}>
      <img src={mobileSrc} alt="Estudio jurídico" className="h-full w-full object-cover lg:hidden" style={{ objectPosition: mobilePosition }} width={1600} height={1200} loading="eager" fetchPriority="high" decoding="async" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "true"; event.currentTarget.src = desktopSrc; } }} />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden lg:block">
        <img src={desktopSrc} alt="Estudio jurídico" className="h-full w-full object-cover" style={{ objectPosition: desktopPosition }} width={1600} height={1200} loading="eager" fetchPriority="high" decoding="async" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "true"; event.currentTarget.src = fallbackSrc; } }} />
      </div>
    </div>
  );
}
