import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
.admin-gallery-tools {
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}
.admin-gallery-tools__title {
  font-size: .82rem;
  font-weight: 800;
  color: var(--color-foreground);
}
.admin-gallery-tools__hint {
  margin-top: .2rem;
  font-size: .72rem;
  line-height: 1.4;
  color: var(--color-muted-foreground);
}
.admin-gallery-settings {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: .65rem;
  align-items: end;
  margin-top: .8rem;
  padding: .8rem;
  border: 1px solid var(--color-border);
  border-radius: .85rem;
  background: color-mix(in oklch, var(--color-muted) 45%, var(--color-card));
}
.admin-gallery-settings label {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .76rem;
  font-weight: 650;
}
.admin-gallery-settings select {
  min-height: 38px;
  border: 1px solid var(--color-input);
  border-radius: .65rem;
  background: var(--color-background);
  padding: 0 .65rem;
  color: var(--color-foreground);
}
.admin-gallery-order {
  display: grid;
  gap: .5rem;
  margin-top: .8rem;
}
.admin-gallery-order__item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: .6rem;
  border: 1px solid var(--color-border);
  border-radius: .75rem;
  padding: .45rem;
  background: var(--color-background);
}
.admin-gallery-order__item img {
  width: 42px;
  height: 42px;
  border-radius: .55rem;
  object-fit: cover;
}
.admin-gallery-order__item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: .72rem;
  font-weight: 650;
}
.admin-gallery-order__actions {
  display: flex;
  gap: .3rem;
}
.admin-gallery-order__actions button,
.admin-gallery-save {
  min-width: 38px;
  min-height: 38px;
  border: 1px solid var(--color-border);
  border-radius: .65rem;
  background: var(--color-card);
  color: var(--color-foreground);
  font-weight: 800;
  cursor: pointer;
}
.admin-gallery-save {
  margin-top: .8rem;
  width: 100%;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
}
.admin-gallery-save:disabled,
.admin-gallery-order__actions button:disabled { opacity: .45; cursor: not-allowed; }
.admin-gallery-status { margin-top: .55rem; font-size: .72rem; color: var(--color-muted-foreground); }

/* Homepage gallery carousel. */
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
  flex-wrap: wrap;
  gap: .5rem;
  margin-bottom: 1rem;
}
.site-gallery-control,
.site-gallery-play {
  display: inline-grid;
  min-width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-card);
  color: var(--color-foreground);
  font-size: 1.05rem;
  font-weight: 800;
  box-shadow: 0 8px 22px color-mix(in oklch, var(--color-foreground) 7%, transparent);
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease;
}
.site-gallery-play { padding: 0 .9rem; font-size: .75rem; }
.site-gallery-control:hover,
.site-gallery-play:hover {
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
.site-gallery-auto-label {
  margin-left: auto;
  font-size: .7rem;
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
@media (max-width: 639px) {
  .admin-gallery-settings { grid-template-columns: 1fr; }
  .site-gallery-auto-label { width: 100%; margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  #galeria [data-gallery-track="true"] { scroll-behavior: auto; }
  #galeria [data-gallery-track="true"] > img,
  .site-gallery-control,
  .site-gallery-play,
  body:has(header > div + nav) .admin-photo-action { transition: none; }
}
`;

type MediaSettings = {
  gallery?: string[];
  galleryAutoplay?: boolean;
  galleryAutoplaySeconds?: number;
};

async function loadMediaSettings(): Promise<MediaSettings> {
  const { data } = await supabase
    .from("site_content")
    .select("data")
    .eq("lang", "es")
    .maybeSingle();
  return (((data?.data as any)?.media) ?? {}) as MediaSettings;
}

async function persistMediaSettings(patch: MediaSettings) {
  for (const lang of ["es", "pt"] as const) {
    const { data, error: readError } = await supabase
      .from("site_content")
      .select("data")
      .eq("lang", lang)
      .maybeSingle();
    if (readError) throw readError;
    const current = (data?.data as any) ?? {};
    const next = { ...current, media: { ...(current.media ?? {}), ...patch } };
    const { error } = await supabase
      .from("site_content")
      .upsert({ lang, data: next, updated_at: new Date().toISOString() }, { onConflict: "lang" });
    if (error) throw error;
  }
}

function enhanceAdminPhotoButtons() {
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
      if (photoCard?.querySelector("img")) {
        button.classList.add("admin-photo-action", "admin-photo-action--danger");
      }
    }
  });
}

async function enhanceAdminGalleryTools() {
  if (window.location.pathname !== "/admin") return;
  const galleryLabel = Array.from(document.querySelectorAll<HTMLParagraphElement>("main p"))
    .find((p) => p.textContent?.trim().startsWith("Galería en la web"));
  const card = galleryLabel?.closest<HTMLDivElement>("div.rounded-2xl");
  if (!card || card.dataset.galleryTools === "true" || card.dataset.galleryTools === "loading") return;
  card.dataset.galleryTools = "loading";

  try {
    const media = await loadMediaSettings();
    let draft = Array.isArray(media.gallery) ? [...media.gallery] : [];
    const autoplay = media.galleryAutoplay !== false;
    const seconds = Math.min(15, Math.max(3, Number(media.galleryAutoplaySeconds) || 5));

    const tools = document.createElement("div");
    tools.className = "admin-gallery-tools";
    tools.innerHTML = `
      <div class="admin-gallery-tools__title">Carrusel del homepage</div>
      <div class="admin-gallery-tools__hint">Activa el avance automático y define el orden exacto de las imágenes.</div>
      <div class="admin-gallery-settings">
        <div>
          <label><input data-autoplay type="checkbox" ${autoplay ? "checked" : ""}> Reproducción automática</label>
          <div class="admin-gallery-tools__hint">El visitante también puede pausar el carrusel.</div>
        </div>
        <label>Intervalo
          <select data-seconds>
            ${[3, 5, 7, 10].map((value) => `<option value="${value}" ${value === seconds ? "selected" : ""}>${value}s</option>`).join("")}
          </select>
        </label>
      </div>
      <button type="button" class="admin-gallery-save" data-save-settings>Guardar autoplay</button>
      <div class="admin-gallery-tools__title" style="margin-top:1rem">Orden de imágenes</div>
      <div class="admin-gallery-tools__hint">Usa las flechas y luego guarda el orden. La página se recargará para sincronizar el panel.</div>
      <div class="admin-gallery-order" data-order-list></div>
      <button type="button" class="admin-gallery-save" data-save-order>Guardar orden</button>
      <div class="admin-gallery-status" data-status aria-live="polite"></div>
    `;
    card.appendChild(tools);

    const orderList = tools.querySelector<HTMLElement>("[data-order-list]")!;
    const status = tools.querySelector<HTMLElement>("[data-status]")!;
    const saveOrder = tools.querySelector<HTMLButtonElement>("[data-save-order]")!;

    const renderOrder = () => {
      orderList.replaceChildren();
      if (!draft.length) {
        const empty = document.createElement("div");
        empty.className = "admin-gallery-tools__hint";
        empty.textContent = "Agrega fotos a la galería para poder ordenarlas.";
        orderList.appendChild(empty);
        saveOrder.disabled = true;
        return;
      }
      saveOrder.disabled = false;
      draft.forEach((url, index) => {
        const row = document.createElement("div");
        row.className = "admin-gallery-order__item";
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Imagen ${index + 1}`;
        const label = document.createElement("span");
        label.textContent = `Posición ${index + 1}`;
        const actions = document.createElement("div");
        actions.className = "admin-gallery-order__actions";
        const up = document.createElement("button");
        up.type = "button";
        up.textContent = "↑";
        up.title = "Mover hacia arriba";
        up.disabled = index === 0;
        const down = document.createElement("button");
        down.type = "button";
        down.textContent = "↓";
        down.title = "Mover hacia abajo";
        down.disabled = index === draft.length - 1;
        up.addEventListener("click", () => {
          [draft[index - 1], draft[index]] = [draft[index], draft[index - 1]];
          renderOrder();
        });
        down.addEventListener("click", () => {
          [draft[index + 1], draft[index]] = [draft[index], draft[index + 1]];
          renderOrder();
        });
        actions.append(up, down);
        row.append(img, label, actions);
        orderList.appendChild(row);
      });
    };
    renderOrder();

    tools.querySelector<HTMLButtonElement>("[data-save-settings]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const enabled = tools.querySelector<HTMLInputElement>("[data-autoplay]")?.checked ?? true;
      const selectedSeconds = Number(tools.querySelector<HTMLSelectElement>("[data-seconds]")?.value || 5);
      button.disabled = true;
      status.textContent = "Guardando configuración…";
      try {
        await persistMediaSettings({ galleryAutoplay: enabled, galleryAutoplaySeconds: selectedSeconds });
        status.textContent = "Autoplay guardado correctamente.";
      } catch (error) {
        status.textContent = `Error: ${(error as Error).message}`;
      } finally {
        button.disabled = false;
      }
    });

    saveOrder.addEventListener("click", async () => {
      saveOrder.disabled = true;
      status.textContent = "Guardando orden…";
      try {
        await persistMediaSettings({ gallery: draft });
        status.textContent = "Orden guardado. Sincronizando panel…";
        window.setTimeout(() => window.location.reload(), 350);
      } catch (error) {
        status.textContent = `Error: ${(error as Error).message}`;
        saveOrder.disabled = false;
      }
    });

    card.dataset.galleryTools = "true";
  } catch (error) {
    card.dataset.galleryTools = "";
    console.warn("[gallery tools]", error);
  }
}

async function enhanceGallery() {
  const section = document.getElementById("galeria");
  if (!section || section.dataset.galleryEnhanced === "true" || section.dataset.galleryEnhanced === "loading") return;
  section.dataset.galleryEnhanced = "loading";

  const track = section.querySelector<HTMLElement>(":scope > div > div.grid");
  if (!track) {
    section.dataset.galleryEnhanced = "";
    return;
  }

  track.dataset.galleryTrack = "true";
  track.setAttribute("role", "region");
  track.setAttribute("aria-label", "Galería de imágenes");
  track.setAttribute("tabindex", "0");

  const images = Array.from(track.querySelectorAll<HTMLImageElement>(":scope > img"));
  if (images.length <= 1) {
    section.dataset.galleryEnhanced = "true";
    return;
  }

  let media: MediaSettings = {};
  try { media = await loadMediaSettings(); } catch (error) { console.warn("[gallery autoplay]", error); }
  const autoplayConfigured = media.galleryAutoplay !== false;
  const autoplaySeconds = Math.min(15, Math.max(3, Number(media.galleryAutoplaySeconds) || 5));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const play = document.createElement("button");
  play.type = "button";
  play.className = "site-gallery-play";
  play.setAttribute("aria-label", autoplayConfigured ? "Pausar reproducción automática" : "Iniciar reproducción automática");

  const autoLabel = document.createElement("span");
  autoLabel.className = "site-gallery-auto-label";
  autoLabel.textContent = autoplayConfigured ? `Autoplay cada ${autoplaySeconds}s` : "Autoplay desactivado";

  controls.append(previous, counter, next, play, autoLabel);
  track.parentElement?.insertBefore(controls, track);

  const step = () => {
    const first = images[0];
    return first ? first.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
  };
  const currentIndex = () => {
    const amount = Math.max(step(), 1);
    return Math.min(images.length - 1, Math.max(0, Math.round(track.scrollLeft / amount)));
  };
  const updateCounter = () => {
    counter.textContent = `${currentIndex() + 1} / ${images.length}`;
  };
  const goTo = (index: number) => {
    const safeIndex = (index + images.length) % images.length;
    track.scrollTo({ left: safeIndex * step(), behavior: reduceMotion ? "auto" : "smooth" });
  };

  let userPaused = !autoplayConfigured || reduceMotion;
  let interactionPaused = false;
  let timer: number | null = null;

  const syncPlayLabel = () => {
    play.textContent = userPaused ? "▶ Reproducir" : "Ⅱ Pausar";
    play.setAttribute("aria-pressed", userPaused ? "true" : "false");
  };
  const stopTimer = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };
  const startTimer = () => {
    stopTimer();
    if (userPaused || interactionPaused || document.hidden) return;
    timer = window.setInterval(() => goTo(currentIndex() + 1), autoplaySeconds * 1000);
  };

  previous.addEventListener("click", () => { goTo(currentIndex() - 1); startTimer(); });
  next.addEventListener("click", () => { goTo(currentIndex() + 1); startTimer(); });
  play.addEventListener("click", () => {
    userPaused = !userPaused;
    syncPlayLabel();
    startTimer();
  });
  track.addEventListener("scroll", updateCounter, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(currentIndex() - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(currentIndex() + 1);
    }
  });
  section.addEventListener("pointerenter", () => { interactionPaused = true; stopTimer(); });
  section.addEventListener("pointerleave", () => { interactionPaused = false; startTimer(); });
  section.addEventListener("focusin", () => { interactionPaused = true; stopTimer(); });
  section.addEventListener("focusout", () => { interactionPaused = false; startTimer(); });
  document.addEventListener("visibilitychange", startTimer);

  syncPlayLabel();
  startTimer();
  section.dataset.galleryEnhanced = "true";
}

export function UiEnhancer() {
  useEffect(() => {
    const enhance = () => {
      enhanceAdminPhotoButtons();
      void enhanceAdminGalleryTools();
      void enhanceGallery();
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <style>{UI_STYLES}</style>;
}
