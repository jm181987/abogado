import { useEffect } from "react";

const UI_STYLES = `
/* Admin photo management: make upload and photo actions unmistakable. */
body:has(header > div + nav) .admin-photo-uploader {
  border: 1px solid color-mix(in oklch, var(--color-primary) 35%, var(--color-border));
  background: color-mix(in oklch, var(--color-primary) 6%, var(--color-card));
  box-shadow: 0 14px 35px color-mix(in oklch, var(--color-foreground) 5%, transparent);
}
body:has(header > div + nav) .admin-photo-uploader::before {
  content: "Agregar nueva foto";
  display: block;
  margin-bottom: .4rem;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-foreground);
}
body:has(header > div + nav) .admin-photo-uploader::after {
  content: "Selecciona una imagen y se subirá automáticamente al banco de fotos.";
  display: block;
  margin-top: .65rem;
  font-size: .75rem;
  line-height: 1.4;
  color: var(--color-muted-foreground);
}
body:has(header > div + nav) .admin-photo-uploader input[type="file"] {
  display: block;
  width: 100%;
  min-height: 52px;
  margin-top: .85rem;
  padding: .35rem;
  border: 1px dashed color-mix(in oklch, var(--color-primary) 45%, var(--color-border));
  border-radius: .85rem;
  background: var(--color-background);
  color: var(--color-foreground);
  cursor: pointer;
}
body:has(header > div + nav) .admin-photo-uploader input[type="file"]::file-selector-button {
  min-height: 42px;
  margin-right: .8rem;
  padding: .65rem 1rem;
  border: 0;
  border-radius: .7rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: 700;
  cursor: pointer;
}
body:has(header > div + nav) .admin-photo-action {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: .35rem;
  border-radius: .7rem !important;
  padding: .55rem .8rem !important;
  border-width: 1px !important;
  border-style: solid !important;
  font-size: .75rem !important;
  font-weight: 700 !important;
  line-height: 1.1;
  text-decoration: none !important;
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}
body:has(header > div + nav) .admin-photo-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 7px 18px color-mix(in oklch, var(--color-foreground) 10%, transparent);
}
body:has(header > div + nav) .admin-photo-action--hero {
  border-color: var(--color-primary) !important;
  background: var(--color-primary) !important;
  color: var(--color-primary-foreground) !important;
}
body:has(header > div + nav) .admin-photo-action--gallery {
  border-color: color-mix(in oklch, var(--color-primary) 48%, var(--color-border)) !important;
  background: color-mix(in oklch, var(--color-primary) 10%, var(--color-background)) !important;
  color: var(--color-foreground) !important;
}
body:has(header > div + nav) .admin-photo-action--gallery-active {
  border-color: var(--color-foreground) !important;
  background: var(--color-foreground) !important;
  color: var(--color-background) !important;
}
body:has(header > div + nav) .admin-photo-action--danger {
  border-color: color-mix(in oklch, var(--color-destructive) 45%, var(--color-border)) !important;
  background: color-mix(in oklch, var(--color-destructive) 8%, var(--color-background)) !important;
  color: var(--color-destructive) !important;
}

/* Homepage gallery carousel. */
#galeria .site-gallery-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
#galeria [data-gallery-track="true"] {
  display: flex !important;
  grid-template-columns: none !important;
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  padding: .35rem .15rem 1rem;
}
#galeria [data-gallery-track="true"] > img {
  flex: 0 0 min(78vw, 340px);
  width: min(78vw, 340px) !important;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  transition: transform 220ms ease, box-shadow 220ms ease;
}
#galeria [data-gallery-track="true"] > img:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 45px color-mix(in oklch, var(--color-foreground) 12%, transparent);
}
.site-gallery-controls {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: 1rem;
}
.site-gallery-control {
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-card);
  color: var(--color-foreground);
  font-size: 1.15rem;
  font-weight: 700;
  box-shadow: 0 8px 22px color-mix(in oklch, var(--color-foreground) 7%, transparent);
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease;
}
.site-gallery-control:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  transform: translateY(-1px);
}
.site-gallery-counter {
  min-width: 3.75rem;
  text-align: center;
  font-size: .75rem;
  font-weight: 700;
  color: var(--color-muted-foreground);
}
@media (min-width: 640px) {
  #galeria [data-gallery-track="true"] > img {
    flex-basis: min(42vw, 360px);
    width: min(42vw, 360px) !important;
  }
}
@media (min-width: 1024px) {
  #galeria [data-gallery-track="true"] > img {
    flex-basis: calc((100% - 2rem) / 3);
    width: calc((100% - 2rem) / 3) !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  #galeria [data-gallery-track="true"] { scroll-behavior: auto; }
  #galeria [data-gallery-track="true"] > img,
  .site-gallery-control,
  body:has(header > div + nav) .admin-photo-action { transition: none; }
}
`;

function enhanceAdminPhotos() {
  if (window.location.pathname !== "/admin") return;

  const fileInput = document.querySelector<HTMLInputElement>('main input[type="file"][accept="image/*"]');
  fileInput?.parentElement?.classList.add("admin-photo-uploader");

  document.querySelectorAll<HTMLButtonElement>("main button").forEach((button) => {
    const text = button.textContent?.trim() ?? "";
    if (text === "Usar como hero" || text === "✓ Hero") {
      button.classList.add("admin-photo-action", "admin-photo-action--hero");
    } else if (text === "+ Galería") {
      button.classList.add("admin-photo-action", "admin-photo-action--gallery");
    } else if (text === "Quitar galería") {
      button.classList.add("admin-photo-action", "admin-photo-action--gallery-active");
    } else if (text === "Eliminar" || text === "Quitar") {
      const photoCard = button.closest("div.rounded-2xl");
      if (photoCard?.querySelector('img')) {
        button.classList.add("admin-photo-action", "admin-photo-action--danger");
      }
    }
  });
}

function enhanceGallery() {
  const section = document.getElementById("galeria");
  if (!section) return;
  const track = section.querySelector<HTMLElement>(":scope > div > div.grid");
  if (!track || track.dataset.galleryTrack === "true") return;

  track.dataset.galleryTrack = "true";
  track.setAttribute("role", "region");
  track.setAttribute("aria-label", "Galería de imágenes");
  track.setAttribute("tabindex", "0");

  const images = Array.from(track.querySelectorAll<HTMLImageElement>(":scope > img"));
  if (images.length <= 1) return;

  const controls = document.createElement("div");
  controls.className = "site-gallery-controls";
  controls.setAttribute("aria-label", "Controles de la galería");

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "site-gallery-control";
  previous.setAttribute("aria-label", "Imagen anterior");
  previous.textContent = "←";

  const counter = document.createElement("span");
  counter.className = "site-gallery-counter";
  counter.setAttribute("aria-live", "polite");
  counter.textContent = `1 / ${images.length}`;

  const next = document.createElement("button");
  next.type = "button";
  next.className = "site-gallery-control";
  next.setAttribute("aria-label", "Imagen siguiente");
  next.textContent = "→";

  controls.append(previous, counter, next);
  track.parentElement?.insertBefore(controls, track);

  const step = () => {
    const first = images[0];
    return first ? first.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
  };
  const updateCounter = () => {
    const amount = Math.max(step(), 1);
    const index = Math.min(images.length - 1, Math.max(0, Math.round(track.scrollLeft / amount)));
    counter.textContent = `${index + 1} / ${images.length}`;
  };

  previous.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", updateCounter, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      track.scrollBy({ left: -step(), behavior: "smooth" });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      track.scrollBy({ left: step(), behavior: "smooth" });
    }
  });
}

export function UiEnhancer() {
  useEffect(() => {
    const enhance = () => {
      enhanceAdminPhotos();
      enhanceGallery();
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <style>{UI_STYLES}</style>;
}
