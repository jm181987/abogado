import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;
let schemaPromise: Promise<void> | null = null;

export function db() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurada en el servidor");

  client = postgres(url, {
    max: Number(process.env.DB_POOL_MAX || 10),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return client;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS app_users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'user')),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx ON admin_sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS site_content (
    lang text PRIMARY KEY CHECK (lang IN ('es', 'pt')),
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS plans (
    id uuid PRIMARY KEY,
    name text,
    name_es text NOT NULL DEFAULT '',
    name_pt text NOT NULL DEFAULT '',
    age_es text NOT NULL DEFAULT '',
    age_pt text NOT NULL DEFAULT '',
    price text NOT NULL DEFAULT '',
    old_price text,
    features_es text[] NOT NULL DEFAULT '{}',
    features_pt text[] NOT NULL DEFAULT '{}',
    popular boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS plans_active_order_idx ON plans(active, sort_order)`,
  `CREATE TABLE IF NOT EXISTS asset_buckets (
    id text PRIMARY KEY,
    is_public boolean NOT NULL DEFAULT true,
    max_file_size bigint NOT NULL DEFAULT 15728640,
    allowed_mime_types text[] NOT NULL DEFAULT ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']::text[],
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS site_photos (
    id uuid PRIMARY KEY,
    bucket_id text NOT NULL REFERENCES asset_buckets(id),
    slot text NOT NULL,
    storage_path text NOT NULL UNIQUE,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    sha256 text NOT NULL,
    content bytea NOT NULL,
    alt_es text,
    alt_pt text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS site_photos_updated_idx ON site_photos(updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS migration_state (
    key text PRIMARY KEY,
    completed_at timestamptz,
    details jsonb NOT NULL DEFAULT '{}'::jsonb
  )`,
];

async function installSchema() {
  const sql = db();
  for (const statement of schemaStatements) await sql.unsafe(statement);
  await sql`INSERT INTO site_content (lang, data) VALUES ('es', '{}'::jsonb), ('pt', '{}'::jsonb) ON CONFLICT (lang) DO NOTHING`;
  await sql`INSERT INTO asset_buckets (id, is_public) VALUES ('site-photos', true) ON CONFLICT (id) DO NOTHING`;
  await sql`DELETE FROM admin_sessions WHERE expires_at <= now()`;
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = installSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}
