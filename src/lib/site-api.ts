export type ApiUser = { id: string; email: string; role: "admin" | "user" };
export type ContentRow = { lang: "es" | "pt"; data: any; updated_at?: string };
export type ApiPhoto = {
  id: string;
  slot: string;
  storage_path: string;
  alt_es: string | null;
  alt_pt: string | null;
  updated_at: string;
  public_url: string;
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Error ${response.status}`);
  return payload as T;
}

export async function getSession() {
  return api<{ user: ApiUser | null }>("/api/auth/session");
}

export async function signInApi(email: string, password: string) {
  return api<{ user: ApiUser }>("/api/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function signUpApi(email: string, password: string) {
  return api<{ user: ApiUser }>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function signOutApi() {
  return api<{ ok: true }>("/api/auth/signout", { method: "POST" });
}

export async function getPublicContent(lang: "es" | "pt") {
  return api<{ content: any; plans: any[] }>(`/api/content?lang=${lang}`);
}

export async function getAdminContent(langs: Array<"es" | "pt"> = ["es", "pt"]) {
  return api<{ rows: ContentRow[] }>(`/api/admin/content?langs=${langs.join(",")}`);
}

export async function saveAdminContent(rows: ContentRow[]) {
  return api<{ rows: ContentRow[] }>("/api/admin/content", { method: "PUT", body: JSON.stringify({ rows }) });
}

export async function listPlans() {
  return api<{ plans: any[] }>("/api/admin/plans");
}

export async function createPlan(plan: Record<string, unknown>) {
  return api<{ plan: any }>("/api/admin/plans", { method: "POST", body: JSON.stringify(plan) });
}

export async function updatePlan(id: string, plan: Record<string, unknown>) {
  return api<{ plan: any }>(`/api/admin/plans/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(plan) });
}

export async function deletePlan(id: string) {
  return api<{ ok: true }>(`/api/admin/plans/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listPhotos() {
  return api<{ photos: ApiPhoto[] }>("/api/admin/photos");
}

export async function uploadPhoto(file: File, options: { slot: string; storage_path?: string; alt_es?: string | null; alt_pt?: string | null }) {
  const form = new FormData();
  form.set("file", file);
  form.set("slot", options.slot);
  if (options.storage_path) form.set("storage_path", options.storage_path);
  if (options.alt_es) form.set("alt_es", options.alt_es);
  if (options.alt_pt) form.set("alt_pt", options.alt_pt);
  return api<{ photo: ApiPhoto }>("/api/admin/photos", { method: "POST", body: form });
}

export async function deletePhoto(id: string) {
  return api<{ ok: true }>(`/api/admin/photos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
