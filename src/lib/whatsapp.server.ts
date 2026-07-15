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
