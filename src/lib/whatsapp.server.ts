// Server-only. Cliente HTTP para Evolution API.
// Nunca importar desde código de navegador ni desde .functions.ts a nivel de módulo.

const BASE = () => {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) throw new Error("EVOLUTION_API_URL no configurada");
  return url.replace(/\/+$/, "");
};

const KEY = () => {
  const k = process.env.EVOLUTION_API_KEY;
  if (!k) throw new Error("EVOLUTION_API_KEY no configurada");
  return k;
};

async function evo(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: KEY(),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = text ? JSON.parse(text) : {}; } catch { /* keep text */ }
  if (!res.ok) {
    const msg = typeof body === "object" && body && "message" in body
      ? String((body as { message: unknown }).message)
      : text || res.statusText;
    throw new Error(`Evolution ${res.status}: ${msg}`);
  }
  return body as any;
}

/** Normaliza un teléfono guardado (+55...) al formato Evolution: solo dígitos. */
export function toEvoNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function evoInstanceExists(name: string): Promise<boolean> {
  try {
    const list = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(name)}`);
    if (Array.isArray(list)) return list.length > 0;
    return !!list;
  } catch {
    return false;
  }
}

export async function evoCreateInstance(name: string) {
  return evo(`/instance/create`, {
    method: "POST",
    body: JSON.stringify({
      instanceName: name,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

export async function evoConnect(name: string): Promise<{ base64?: string; code?: string; pairingCode?: string }> {
  const r = await evo(`/instance/connect/${encodeURIComponent(name)}`);
  return {
    base64: r?.base64 ?? r?.qrcode?.base64,
    code: r?.code ?? r?.qrcode?.code,
    pairingCode: r?.pairingCode,
  };
}

export async function evoState(name: string): Promise<{ state: string; number?: string }> {
  const r = await evo(`/instance/connectionState/${encodeURIComponent(name)}`);
  const state = r?.instance?.state ?? r?.state ?? "unknown";
  const number = r?.instance?.owner ?? r?.instance?.wuid ?? undefined;
  return { state, number: number ? String(number).split("@")[0] : undefined };
}

export async function evoLogout(name: string) {
  return evo(`/instance/logout/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export async function evoSendText(name: string, number: string, text: string) {
  return evo(`/message/sendText/${encodeURIComponent(name)}`, {
    method: "POST",
    body: JSON.stringify({ number: toEvoNumber(number), text }),
  });
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export function formatDateEs(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function slugifyBrand(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40) || "instance";
}

/** Lee la marca guardada en site_content. Prueba varios idiomas y devuelve
 *  el primer nombre no vacío encontrado. Si no hay nada guardado, devuelve null. */
export async function getBrandInfo(admin: any): Promise<{ name: string; slug: string }> {
  try {
    const { data: rows } = await admin.from("site_content").select("lang, data");
    const list = Array.isArray(rows) ? rows : [];
    // Priorizar 'es' si existe
    list.sort((a: any, b: any) => (a.lang === "es" ? -1 : b.lang === "es" ? 1 : 0));
    for (const r of list) {
      const b = r?.data?.brand ?? {};
      const n1 = String(b.name1 ?? "").trim();
      const n2 = String(b.name2 ?? "").trim();
      const name = [n1, n2].filter(Boolean).join(" ");
      if (name) return { name, slug: slugifyBrand(name) };
    }
  } catch (e) {
    console.warn("[wa] getBrandInfo:", (e as Error).message);
  }
  // Sin marca configurada: nombre neutro
  return { name: "Reservas", slug: "reservas" };
}


