import { useEffect, useMemo, useRef } from "react";
import type { Lang } from "@/lib/i18n";

type GalleryCarouselProps = {
  images: string[];
  lang: Lang;
};

const AUTOPLAY_MS = 6000;
const RESET_AFTER_MS = 850;

export function GalleryCarousel({ images, lang }: GalleryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const renderedImages = useMemo(() => (images.length > 1 ? [...images, ...images] : images), [images]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | null = null;
    let resetTimer: number | null = null;
    let disposed = false;
    let visualIndex = 0;
    const decodedImages = new Map<string, Promise<void>>();

    const getSlides = () => Array.from(track.querySelectorAll<HTMLElement>("[data-gallery-slide='true']"));

    const preloadAndDecode = (url: string) => {
      const existing = decodedImages.get(url);
      if (existing) return existing;

      const promise = new Promise<void>((resolve) => {
        const preload = new Image();
        preload.decoding = "sync";
        preload.onload = () => {
          if (typeof preload.decode === "function") {
            void preload.decode().catch(() => undefined).finally(resolve);
          } else {
            resolve();
          }
        };
        preload.onerror = () => resolve();
        preload.src = url;
        if (preload.complete) {
          if (typeof preload.decode === "function") {
            void preload.decode().catch(() => undefined).finally(resolve);
          } else {
            resolve();
          }
        }
      });

      decodedImages.set(url, promise);
      return promise;
    };

    const goToVisualIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
      const slides = getSlides();
      const target = slides[index];
      if (!target) return;
      track.scrollTo({ left: target.offsetLeft, behavior: reduceMotion ? "auto" : behavior });
    };

    const preloadAhead = () => {
      const logicalIndex = visualIndex % images.length;
      void preloadAndDecode(images[(logicalIndex + 1) % images.length]);
      if (images.length > 2) void preloadAndDecode(images[(logicalIndex + 2) % images.length]);
    };

    const advance = async () => {
      if (disposed) return;

      const nextVisualIndex = visualIndex + 1;
      const logicalNextIndex = nextVisualIndex % images.length;
      await preloadAndDecode(images[logicalNextIndex]);
      if (disposed) return;

      visualIndex = nextVisualIndex;
      goToVisualIndex(visualIndex, "smooth");

      // The second sequence is an exact visual copy of the first one. After
      // reaching its first card, reset instantly to the original first card.
      // Because both cards are identical, the visitor never sees a jump and
      // autoplay can continue forever.
      if (visualIndex === images.length) {
        if (resetTimer !== null) window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          if (disposed) return;
          visualIndex = 0;
          goToVisualIndex(0, "auto");
          preloadAhead();
        }, reduceMotion ? 0 : RESET_AFTER_MS);
      } else {
        window.setTimeout(preloadAhead, 250);
      }
    };

    const stopTimer = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stopTimer();
      if (document.hidden || disposed) return;
      preloadAhead();
      timer = window.setInterval(() => { void advance(); }, AUTOPLAY_MS);
    };

    // Load every original source, not a resized or transformed derivative.
    // This also prevents progressive JPEGs from becoming visible before their
    // full-resolution decode is ready when the carousel advances.
    images.forEach((url) => { void preloadAndDecode(url); });

    const handleVisibility = () => start();
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      stopTimer();
      if (resetTimer !== null) window.clearTimeout(resetTimer);
    };
  }, [images]);

  if (!images.length) return null;

  return (
    <section id="galeria" data-gallery-enhanced="true" className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {lang === "es" ? "Nuestro espacio" : "Nosso espaço"}
        </p>
        <h2 className="mb-10 font-display text-4xl tracking-[-0.03em] sm:text-5xl">
          {lang === "es" ? "Un entorno profesional y cercano" : "Um ambiente profissional e acolhedor"}
        </h2>

        <div
          ref={trackRef}
          role="region"
          aria-label={lang === "es" ? "Galería de imágenes" : "Galeria de imagens"}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {renderedImages.map((url, index) => {
            const logicalIndex = index % images.length;
            return (
              <div
                key={`${url}-${index}`}
                data-gallery-slide="true"
                aria-hidden={index >= images.length ? "true" : undefined}
                className="relative aspect-[4/5] w-[82vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-border bg-muted shadow-sm sm:w-[360px] sm:max-w-[360px] lg:w-[360px] lg:max-w-[360px]"
              >
                <img
                  src={url}
                  alt={index < images.length ? `${lang === "es" ? "Estudio jurídico" : "Escritório de advocacia"} ${logicalIndex + 1}` : ""}
                  loading="eager"
                  decoding="sync"
                  fetchPriority={logicalIndex < 3 ? "high" : "auto"}
                  draggable={false}
                  className="absolute inset-0 block h-full w-full max-w-none select-none object-cover object-center"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    imageRendering: "auto",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
