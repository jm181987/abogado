import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db, ensureSchema } from "@/lib/db.server";

export type AppUser = { id: string; email: string; role: "admin" | "user" };

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "knj_admin_session";
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_TTL_DAYS || 7));
const BOOTSTRAP_ADMIN_EMAIL_SHA256 = process.env.BOOTSTRAP_ADMIN_EMAIL_SHA256 || "f5a57b8051eb2f24f938256b3e28e83d2dae505feb3f8276e6aa6c37307c5736";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailHash(email: string) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string) {
  const [kind, salt, expectedHex] = stored.split("$");
  if (kind !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookie(token: string, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" || process.env.NODE_ENV === "production";
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" || process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

async function createSession(userId: string) {
  const sql = db();
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await sql`INSERT INTO admin_sessions (token_hash, user_id, expires_at)
    VALUES (${hash}, ${userId}, now() + (${SESSION_DAYS} * interval '1 day'))`;
  return token;
}

export async function signUp(emailInput: string, password: string) {
  await ensureSchema();
  const email = normalizeEmail(emailInput);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido");
  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

  const sql = db();
  const id = randomUUID();
  const passwordHash = hashPassword(password);

  try {
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(72541983)`;
      const existingAdmin = await tx<{ count: number }[]>`SELECT count(*)::int AS count FROM user_roles WHERE role = 'admin'`;
      if (existingAdmin[0]?.count) throw Object.assign(new Error("El administrador ya fue creado. Inicia sesión."), { status: 409 });
      if (emailHash(email) !== BOOTSTRAP_ADMIN_EMAIL_SHA256) throw Object.assign(new Error("Esta cuenta no está autorizada para inicializar el panel."), { status: 403 });
      await tx`INSERT INTO app_users (id, email, password_hash) VALUES (${id}, ${email}, ${passwordHash})`;
      await tx`INSERT INTO user_roles (user_id, role) VALUES (${id}, 'admin')`;
    });
  } catch (error: any) {
    if (error?.code === "23505") throw new Error("Ya existe una cuenta con ese email");
    throw error;
  }

  const token = await createSession(id);
  return { user: { id, email, role: "admin" } satisfies AppUser, token };
}

export async function signIn(emailInput: string, password: string) {
  await ensureSchema();
  const email = normalizeEmail(emailInput);
  const sql = db();
  const rows = await sql<{ id: string; email: string; password_hash: string; role: "admin" | "user" }[]>`
    SELECT u.id, u.email, u.password_hash, r.role
    FROM app_users u
    JOIN user_roles r ON r.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) throw new Error("Email o contraseña incorrectos");
  const token = await createSession(row.id);
  return { user: { id: row.id, email: row.email, role: row.role } satisfies AppUser, token };
}

export async function getSessionUser(request: Request): Promise<AppUser | null> {
  await ensureSchema();
  const token = cookieToken(request);
  if (!token) return null;
  const sql = db();
  const rows = await sql<AppUser[]>`
    SELECT u.id, u.email, r.role
    FROM admin_sessions s
    JOIN app_users u ON u.id = s.user_id
    JOIN user_roles r ON r.user_id = u.id
    WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > now()
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function destroySession(request: Request) {
  await ensureSchema();
  const token = cookieToken(request);
  if (!token) return;
  await db()`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash(token)}`;
}

export async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw Object.assign(new Error("No autenticado"), { status: 401 });
  if (user.role !== "admin") throw Object.assign(new Error("Sin permisos de administrador"), { status: 403 });
  return user;
}
