-- =====================================================================
-- MIGRACIÓN COMPLETA — Vizcaya Salud
-- Ejecutá TODO este SQL en Supabase → SQL Editor (una sola vez)
-- Proyecto: viczgilshgsqtbbvykgi
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ROLES DE USUARIO (admin)
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------
-- 2) PLANES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,                       -- alias legacy (usado en algunos selects)
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
  sort_order int NOT NULL DEFAULT 0,
  position int GENERATED ALWAYS AS (sort_order) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read plans" ON public.plans;
CREATE POLICY "public read plans" ON public.plans
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage plans" ON public.plans;
CREATE POLICY "admins manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 3) CITAS (appointments)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  full_name text,
  email text,
  phone text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  duration_minutes int NOT NULL DEFAULT 60,
  message text,
  status text NOT NULL DEFAULT 'pending',   -- pending|confirmed|completed|cancelled
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments(status);

GRANT INSERT ON public.appointments TO anon;                       -- reservas públicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una reserva desde la web
DROP POLICY IF EXISTS "public insert appointments" ON public.appointments;
CREATE POLICY "public insert appointments" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Chequeo de solape (SELECT restringido a columnas mínimas vía policy amplia; el cliente sólo pide scheduled_at, duration_minutes)
DROP POLICY IF EXISTS "public read appointments slots" ON public.appointments;
CREATE POLICY "public read appointments slots" ON public.appointments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage appointments" ON public.appointments;
CREATE POLICY "admins manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 4) CONTENIDO EDITABLE DEL SITIO (site_content)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  lang text PRIMARY KEY,             -- 'es' | 'pt'
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read site_content" ON public.site_content;
CREATE POLICY "public read site_content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage site_content" ON public.site_content;
CREATE POLICY "admins manage site_content" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_content (lang, data) VALUES ('es', '{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO public.site_content (lang, data) VALUES ('pt', '{}'::jsonb) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 5) FOTOS DEL SITIO (site_photos) + BUCKET
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL,
  storage_path text NOT NULL,
  alt_es text,
  alt_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_photos TO authenticated;
GRANT ALL ON public.site_photos TO service_role;
ALTER TABLE public.site_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read site_photos" ON public.site_photos;
CREATE POLICY "public read site_photos" ON public.site_photos
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage site_photos" ON public.site_photos;
CREATE POLICY "admins manage site_photos" ON public.site_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bucket público para las fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-photos', 'site-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public read site-photos" ON storage.objects;
CREATE POLICY "public read site-photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-photos');

DROP POLICY IF EXISTS "admins write site-photos" ON storage.objects;
CREATE POLICY "admins write site-photos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-photos' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 6) CONFIG DE WHATSAPP / EVOLUTION API (español + portugués)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  instance_name text NOT NULL DEFAULT 'vizcaya-salud',
  owner_phone text,
  connected boolean NOT NULL DEFAULT false,
  phone_number text,
  msg_new_client text NOT NULL DEFAULT 'Hola {{name}} 👋 Recibimos tu solicitud para el {{date}} a las {{time}} hrs. Te confirmaremos por este medio muy pronto. ¡Gracias por elegir Vizcaya Salud!',
  msg_new_owner  text NOT NULL DEFAULT '📩 Nueva reserva: {{name}} — {{phone}} para {{date}} {{time}} hrs. Plan: {{plan}}.',
  msg_confirmed  text NOT NULL DEFAULT '✅ ¡Tu hora está confirmada, {{name}}! Te esperamos el {{date}} a las {{time}} hrs.',
  msg_cancelled  text NOT NULL DEFAULT 'Hola {{name}}, lamentamos informarte que tu hora del {{date}} {{time}} hrs fue cancelada. Contáctanos para reagendar.',
  msg_reschedule text NOT NULL DEFAULT 'Hola {{name}}, tu hora fue reagendada para el {{date}} a las {{time}} hrs. ¡Te esperamos!',
  msg_reminder   text NOT NULL DEFAULT 'Recordatorio ⏰ Hola {{name}}, mañana {{date}} a las {{time}} hrs tienes tu hora agendada. ¡Te esperamos!',
  msg_new_client_pt text NOT NULL DEFAULT 'Olá {{name}} 👋 Recebemos sua solicitação para o dia {{date}} às {{time}}h. Em breve confirmaremos por aqui. Obrigado por escolher {{brand}}!',
  msg_new_owner_pt  text NOT NULL DEFAULT '📩 Nova reserva: {{name}} — {{phone}} para {{date}} {{time}}h. Plano: {{plan}}.',
  msg_confirmed_pt  text NOT NULL DEFAULT '✅ Seu horário está confirmado, {{name}}! Esperamos você no dia {{date}} às {{time}}h.',
  msg_cancelled_pt  text NOT NULL DEFAULT 'Olá {{name}}, infelizmente seu horário do dia {{date}} às {{time}}h foi cancelado. Entre em contato para reagendar.',
  msg_reschedule_pt text NOT NULL DEFAULT 'Olá {{name}}, seu horário foi remarcado para {{date}} às {{time}}h. Esperamos você!',
  msg_reminder_pt   text NOT NULL DEFAULT 'Lembrete ⏰ Olá {{name}}, amanhã {{date}} às {{time}}h você tem seu horário agendado. Esperamos você!',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.whatsapp_config (id) VALUES (true) ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_config TO authenticated;
GRANT ALL ON public.whatsapp_config TO service_role;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage whatsapp_config" ON public.whatsapp_config;
CREATE POLICY "admins manage whatsapp_config" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- ✅ LISTO. Después de correr esto:
--   1. Creá tu usuario en Authentication → Users (o registrate en /auth).
--   2. Corré:  INSERT INTO public.user_roles (user_id, role)
--              VALUES ('<TU_USER_ID_UUID>', 'admin');
--   3. Ya podés entrar a /admin.
-- =====================================================================
