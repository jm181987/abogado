import { createHash } from "node:crypto";
import { db, ensureSchema } from "@/lib/db.server";

const LEGACY_URL = "https://viczgilshgsqtbbvykgi.supabase.co";
const LEGACY_PUBLISHABLE_KEY = "sb_publishable__3LETC6gpD6gI6g5_N6ryw_iAgJ6emf";
const LEGACY_MEDIA_PREFIX = `${LEGACY_URL}/storage/v1/object/public/site-photos/`;
const MIGRATION_KEY = "supabase-to-postgres-v1";

let migrationPromise: Promise<void> | null = null;

async function legacyJson<T>(path: string): Promise<T> {
  const response = await fetch(`${LEGACY_URL}/rest/v1/${path}`, {
    headers: { apikey: LEGACY_PUBLISHABLE_KEY, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`No se pudo leer la migración anterior (${response.status})`);
  return response.json() as Promise<T>;
}

function localizeMedia(value: any): any {
  if (typeof value === "string" && value.startsWith(LEGACY_MEDIA_PREFIX)) {
    const path = decodeURIComponent(value.slice(LEGACY_MEDIA_PREFIX.length));
    return `/api/assets/${encodeURIComponent(path)}`;
  }
  if (Array.isArray(value)) return value.map(localizeMedia);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeMedia(item)]));
  return value;
}

async function importLegacy() {
  await ensureSchema();
  const sql = db();
  const state = await sql<{ completed_at: string | null }[]>`SELECT completed_at FROM migration_state WHERE key = ${MIGRATION_KEY}`;
  if (state[0]?.completed_at) return;

  const [contentRows, plans, photos] = await Promise.all([
    legacyJson<Array<{ lang: "es" | "pt"; data: any }>>("site_content?select=lang,data,updated_at&order=lang.asc"),
    legacyJson<any[]>("plans?select=*&order=sort_order.asc"),
    legacyJson<Array<{ id: string; slot: string; storage_path: string; alt_es: string | null; alt_pt: string | null; created_at: string; updated_at: string }>>("site_photos?select=id,slot,storage_path,alt_es,alt_pt,created_at,updated_at&order=updated_at.asc"),
  ]);

  const media = await Promise.all(photos.map(async (photo) => {
    const response = await fetch(`${LEGACY_MEDIA_PREFIX}${photo.storage_path}`);
    if (!response.ok) throw new Error(`No se pudo copiar la imagen ${photo.storage_path}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get("content-type")?.split(";")[0] || (photo.storage_path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    return {
      ...photo,
      bytes,
      mime,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      original_name: photo.storage_path.replace(/^\d+-/, ""),
    };
  }));

  await sql.begin(async (tx) => {
    for (const row of contentRows) {
      await tx`INSERT INTO site_content (lang, data, updated_at)
        VALUES (${row.lang}, ${tx.json(localizeMedia(row.data))}, now())
        ON CONFLICT (lang) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;
    }

    for (const plan of plans) {
      await tx`INSERT INTO plans (id, name, name_es, name_pt, age_es, age_pt, price, old_price, features_es, features_pt, popular, active, sort_order, created_at, updated_at)
        VALUES (${plan.id}, ${plan.name ?? null}, ${plan.name_es ?? ""}, ${plan.name_pt ?? ""}, ${plan.age_es ?? ""}, ${plan.age_pt ?? ""}, ${plan.price ?? ""}, ${plan.old_price ?? null}, ${tx.array(plan.features_es ?? [])}, ${tx.array(plan.features_pt ?? [])}, ${Boolean(plan.popular)}, ${plan.active !== false}, ${Number(plan.sort_order ?? 0)}, ${plan.created_at ?? new Date().toISOString()}, ${plan.updated_at ?? new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, name_es = excluded.name_es, name_pt = excluded.name_pt, age_es = excluded.age_es, age_pt = excluded.age_pt, price = excluded.price, old_price = excluded.old_price, features_es = excluded.features_es, features_pt = excluded.features_pt, popular = excluded.popular, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at`;
    }

    for (const photo of media) {
      await tx`INSERT INTO site_photos (id, bucket_id, slot, storage_path, original_name, mime_type, size_bytes, sha256, content, alt_es, alt_pt, created_at, updated_at)
        VALUES (${photo.id}, 'site-photos', ${photo.slot}, ${photo.storage_path}, ${photo.original_name}, ${photo.mime}, ${photo.bytes.length}, ${photo.sha256}, ${photo.bytes}, ${photo.alt_es}, ${photo.alt_pt}, ${photo.created_at}, ${photo.updated_at})
        ON CONFLICT (id) DO NOTHING`;
    }

    await tx`INSERT INTO migration_state (key, completed_at, details)
      VALUES (${MIGRATION_KEY}, now(), ${tx.json({ content: contentRows.length, plans: plans.length, photos: media.length })})
      ON CONFLICT (key) DO UPDATE SET completed_at = excluded.completed_at, details = excluded.details`;
  });
}

export async function ensureLegacyMigration() {
  if (process.env.SKIP_LEGACY_MIGRATION === "1") return;
  if (!migrationPromise) {
    migrationPromise = importLegacy().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }
  await migrationPromise;
}
