import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/i18n";

type GalleryCarouselProps = {
  images: string[];
  lang: Lang;
};

const AUTOPLAY_MS = 6000;
const GAP_PX = 16;

export function GalleryCarousel({ images, lang }: GalleryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | null = null;
    let disposed = false;
    let advancing = false;
    const decodedImages = new Map<string, Promise<void>>();

    const preloadAndDecode = (url: string) => {
      const existing = decodedImages.get(url);
      if (existing) return existing;

      const promise = new Promise<void>((resolve) => {
        const preload = new Image();
        preload.decoding = "async";

        const finish = () => {
          if (typeof preload.decode === "function") {
            void preload.decode().catch(() => undefined).finally(resolve);
          } else {
            resolve();
          }
        };

        preload.onload = finish;
        preload.onerror = () => resolve();
        preload.src = url;

        if (preload.complete) finish();
      });

      decodedImages.set(url, promise);
      return promise;
    };

    const getSlides = () => Array.from(track.querySelectorAll<HTMLElement>("[data-gallery-slide='true']"));

    const currentIndex = () => {
      const slides = getSlides();
      const first = slides[0];
      if (!first) return 0;
      const step = first.getBoundingClientRect().width + GAP_PX;
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(step, 1))));
    };

    const preloadAhead = () => {
      if (!images.length) return;
      const current = currentIndex();
      void preloadAndDecode(images[(current + 1) % images.length]);
      if (images.length > 2) void preloadAndDecode(images[(current + 2) % images.length]);
    };

    const advance = async () => {
      if (advancing || disposed) return;
      advancing = true;
      try {
        const slides = getSlides();
        if (slides.length <= 1) return;
        const nextIndex = (currentIndex() + 1) % slides.length;

        // Never move a photo into view until its original file has finished
        // downloading and decoding. This prevents progressive JPEGs from
        // looking soft during the first seconds they are visible.
        await preloadAndDecode(images[nextIndex]);
        if (disposed) return;

        const target = slides[nextIndex];
        track.scrollTo({ left: target.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
        window.setTimeout(preloadAhead, 250);
      } finally {
        advancing = false;
      }
    };

    const start = () => {
      if (timer !== null) window.clearInterval(timer);
      if (document.hidden) return;
      preloadAhead();
      timer = window.setInterval(() => { void advance(); }, AUTOPLAY_MS);
    };

    // The first visible cards are requested immediately. The next cards are
    // decoded in advance so autoplay always reveals a fully rendered original.
    images.slice(0, Math.min(3, images.length)).forEach((url) => { void preloadAndDecode(url); });

    const handleVisibility = () => start();
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timer !== null) window.clearInterval(timer);
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
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              data-gallery-slide="true"
              className="relative aspect-[4/5] w-[82vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-border bg-muted shadow-sm sm:w-[360px] sm:max-w-[360px] lg:w-[360px] lg:max-w-[360px]"
            >
              <img
                src={url}
                alt={`${lang === "es" ? "Estudio jurídico" : "Escritório de advocacia"} ${index + 1}`}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
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
          ))}
        </div>
      </div>
    </section>
  );
}
