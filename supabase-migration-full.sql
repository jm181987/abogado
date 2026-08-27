-- =====================================================================
-- MIGRACIÓN BASE — SITIO JURÍDICO
-- Ejecutar en Supabase → SQL Editor
-- Incluye únicamente roles, planes, contenido editable y fotos.
-- No incluye agenda, reservas, recordatorios ni Evolution API.
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
-- 2) PLANES / SERVICIOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 3) CONTENIDO EDITABLE DEL SITIO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  lang text PRIMARY KEY,
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

INSERT INTO public.site_content (lang, data)
VALUES ('es', '{}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.site_content (lang, data)
VALUES ('pt', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 4) FOTOS DEL SITIO + STORAGE
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

-- =====================================================================
-- LISTO
-- Para dar acceso al panel:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<USER_ID>', 'admin');
-- =====================================================================
