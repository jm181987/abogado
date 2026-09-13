import { createHash, randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { db, ensureSchema } from "@/lib/db.server";
import { ensureLegacyMigration } from "@/lib/legacy-migration.server";
import { clearSessionCookie, destroySession, getSessionUser, requireAdmin, sessionCookie, signIn, signUp } from "@/lib/auth.server";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 15 * 1024 * 1024);

function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...(headers || {}) } });
}

function fail(error: unknown) {
  const err = error as any;
  const status = Number(err?.status) || 500;
  const safeMessage = status >= 500 ? "Error interno del servidor" : (err?.message || "Solicitud inválida");
  if (status >= 500) console.error("[api]", error);
  return json({ error: safeMessage }, status);
}

function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin) throw Object.assign(new Error("Origen no permitido"), { status: 403 });
}

function pathParts(splat?: string) {
  return (splat || "").split("/").filter(Boolean).map(decodeURIComponent);
}

function asLang(value: string | null): "es" | "pt" {
  return value === "pt" ? "pt" : "es";
}

function publicPhoto(row: any) {
  return {
    id: row.id,
    slot: row.slot,
    storage_path: row.storage_path,
    alt_es: row.alt_es,
    alt_pt: row.alt_pt,
    updated_at: row.updated_at,
    public_url: `/api/assets/${encodeURIComponent(row.storage_path)}`,
  };
}

async function parseJson(request: Request) {
  try { return await request.json(); }
  catch { throw Object.assign(new Error("JSON inválido"), { status: 400 }); }
}

async function handle(request: Request, splat?: string) {
  try {
    const method = request.method.toUpperCase();
    const parts = pathParts(splat);
    const url = new URL(request.url);

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) verifyOrigin(request);

    if (method === "GET" && parts[0] === "health") {
      await ensureSchema();
      await ensureLegacyMigration();
      await db()`SELECT 1`;
      return json({ ok: true, database: "postgres", storage: "site-photos" });
    }

    if (parts[0] === "auth") {
      if (method === "GET" && parts[1] === "session") return json({ user: await getSessionUser(request) });
      if (method === "POST" && parts[1] === "signup") {
        const body = await parseJson(request);
        const result = await signUp(String(body.email || ""), String(body.password || ""));
        return json({ user: result.user }, 200, { "set-cookie": sessionCookie(result.token, request.url) });
      }
      if (method === "POST" && parts[1] === "signin") {
        const body = await parseJson(request);
        const result = await signIn(String(body.email || ""), String(body.password || ""));
        return json({ user: result.user }, 200, { "set-cookie": sessionCookie(result.token, request.url) });
      }
      if (method === "POST" && parts[1] === "signout") {
        await destroySession(request);
        return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request.url) });
      }
    }

    if (method === "GET" && parts[0] === "assets" && parts[1]) {
      await ensureSchema();
      await ensureLegacyMigration();
      const rows = await db()<Array<{ content: Buffer; mime_type: string; size_bytes: number; sha256: string }>>`
        SELECT content, mime_type, size_bytes, sha256 FROM site_photos WHERE storage_path = ${parts.slice(1).join("/")} LIMIT 1
      `;
      const asset = rows[0];
      if (!asset) return json({ error: "Imagen no encontrada" }, 404);
      return new Response(asset.content, {
        headers: {
          "content-type": asset.mime_type,
          "content-length": String(asset.size_bytes),
          "cache-control": "public, max-age=31536000, immutable",
          etag: `"${asset.sha256}"`,
        },
      });
    }

    if (method === "GET" && parts[0] === "content") {
      await ensureSchema();
      await ensureLegacyMigration();
      const lang = asLang(url.searchParams.get("lang"));
      const sql = db();
      const [rows, plans] = await Promise.all([
        sql<Array<{ data: any }>>`SELECT data FROM site_content WHERE lang = ${lang} LIMIT 1`,
        sql<any[]>`SELECT id, name_es, name_pt, age_es, age_pt, price, old_price, features_es, features_pt, popular, active, sort_order FROM plans WHERE active = true ORDER BY sort_order ASC`,
      ]);
      return json({ content: rows[0]?.data ?? {}, plans });
    }

    if (parts[0] !== "admin") return json({ error: "Ruta no encontrada" }, 404);
    await requireAdmin(request);
    await ensureLegacyMigration();
    const sql = db();

    if (parts[1] === "content") {
      if (method === "GET") {
        const requested = (url.searchParams.get("langs") || "es,pt").split(",").filter((value): value is "es" | "pt" => value === "es" || value === "pt");
        const langs: Array<"es" | "pt"> = requested.length ? requested : ["es", "pt"];
        const rows = await sql<any[]>`SELECT lang, data, updated_at FROM site_content WHERE lang IN ${sql(langs)} ORDER BY lang`;
        return json({ rows });
      }
      if (method === "PUT") {
        const body = await parseJson(request);
        const rows = Array.isArray(body.rows) ? body.rows : [];
        if (!rows.length) throw Object.assign(new Error("No hay contenido para guardar"), { status: 400 });
        for (const row of rows) {
          if (row.lang !== "es" && row.lang !== "pt") throw Object.assign(new Error("Idioma inválido"), { status: 400 });
          await sql`INSERT INTO site_content (lang, data, updated_at) VALUES (${row.lang}, ${sql.json(row.data ?? {})}, now()) ON CONFLICT (lang) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;
        }
        const saved = await sql<any[]>`SELECT lang, data, updated_at FROM site_content WHERE lang IN ${sql(rows.map((row: any) => row.lang))} ORDER BY lang`;
        return json({ rows: saved });
      }
    }

    if (parts[1] === "plans") {
      if (method === "GET" && !parts[2]) {
        const plans = await sql<any[]>`SELECT * FROM plans ORDER BY sort_order ASC`;
        return json({ plans });
      }
      if (method === "POST" && !parts[2]) {
        const body = await parseJson(request);
        const id = randomUUID();
        const inserted = await sql<any[]>`INSERT INTO plans (id, name, name_es, name_pt, age_es, age_pt, price, old_price, features_es, features_pt, popular, active, sort_order)
          VALUES (${id}, ${body.name ?? null}, ${body.name_es ?? ""}, ${body.name_pt ?? ""}, ${body.age_es ?? ""}, ${body.age_pt ?? ""}, ${body.price ?? ""}, ${body.old_price ?? null}, ${sql.array(body.features_es ?? [])}, ${sql.array(body.features_pt ?? [])}, ${Boolean(body.popular)}, ${body.active !== false}, ${Number(body.sort_order ?? 0)}) RETURNING *`;
        return json({ plan: inserted[0] }, 201);
      }
      if (parts[2] && method === "PUT") {
        const body = await parseJson(request);
        const updated = await sql<any[]>`UPDATE plans SET
          name = ${body.name ?? null}, name_es = ${body.name_es ?? ""}, name_pt = ${body.name_pt ?? ""}, age_es = ${body.age_es ?? ""}, age_pt = ${body.age_pt ?? ""}, price = ${body.price ?? ""}, old_price = ${body.old_price ?? null}, features_es = ${sql.array(body.features_es ?? [])}, features_pt = ${sql.array(body.features_pt ?? [])}, popular = ${Boolean(body.popular)}, active = ${body.active !== false}, sort_order = ${Number(body.sort_order ?? 0)}, updated_at = now()
          WHERE id = ${parts[2]} RETURNING *`;
        if (!updated[0]) return json({ error: "Plan no encontrado" }, 404);
        return json({ plan: updated[0] });
      }
      if (parts[2] && method === "DELETE") {
        await sql`DELETE FROM plans WHERE id = ${parts[2]}`;
        return json({ ok: true });
      }
    }

    if (parts[1] === "photos") {
      if (method === "GET" && !parts[2]) {
        const rows = await sql<any[]>`SELECT id, slot, storage_path, alt_es, alt_pt, updated_at FROM site_photos ORDER BY updated_at DESC`;
        return json({ photos: rows.map(publicPhoto) });
      }
      if (method === "POST" && !parts[2]) {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw Object.assign(new Error("Falta la imagen"), { status: 400 });
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw Object.assign(new Error("Formato de imagen no permitido"), { status: 400 });
        if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw Object.assign(new Error("La imagen supera el tamaño permitido"), { status: 400 });

        const bytes = Buffer.from(await file.arrayBuffer());
        const id = randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-160) || "image";
        const requestedPath = form.get("storage_path") ? String(form.get("storage_path")) : "";
        const safeRequestedPath = requestedPath.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 220);
        const storagePath = safeRequestedPath || `${Date.now()}-${id}-${safeName}`;
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        const slot = String(form.get("slot") || `photo-${Date.now()}`).slice(0, 200);
        const altEs = form.get("alt_es") ? String(form.get("alt_es")) : null;
        const altPt = form.get("alt_pt") ? String(form.get("alt_pt")) : null;
        const rows = await sql<any[]>`INSERT INTO site_photos (id, bucket_id, slot, storage_path, original_name, mime_type, size_bytes, sha256, content, alt_es, alt_pt)
          VALUES (${id}, 'site-photos', ${slot}, ${storagePath}, ${safeName}, ${file.type}, ${bytes.length}, ${sha256}, ${bytes}, ${altEs}, ${altPt})
          RETURNING id, slot, storage_path, alt_es, alt_pt, updated_at`;
        return json({ photo: publicPhoto(rows[0]) }, 201);
      }
      if (parts[2] && method === "DELETE") {
        await sql`DELETE FROM site_photos WHERE id = ${parts[2]}`;
        return json({ ok: true });
      }
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (error) {
    return fail(error);
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => handle(request, params._splat),
      POST: ({ request, params }) => handle(request, params._splat),
      PUT: ({ request, params }) => handle(request, params._splat),
      DELETE: ({ request, params }) => handle(request, params._splat),
    },
  },
});
