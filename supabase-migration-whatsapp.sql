-- Ejecuta este SQL en Supabase → SQL Editor
-- Crea la configuración de WhatsApp / Evolution API y agrega columnas necesarias

-- 1) Tabla de configuración (una sola fila)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  instance_name text NOT NULL DEFAULT 'vizcaya-salud',
  owner_phone text,
  connected boolean NOT NULL DEFAULT false,
  phone_number text,
  msg_new_client text NOT NULL DEFAULT 'Hola {{name}} 👋 Recibimos tu solicitud para el {{date}} a las {{time}} hrs. Te confirmaremos por este medio muy pronto. ¡Gracias por elegir Vizcaya Salud!',
  msg_new_owner text NOT NULL DEFAULT '📩 Nueva reserva: {{name}} — {{phone}} para {{date}} {{time}} hrs. Plan: {{plan}}.',
  msg_confirmed text NOT NULL DEFAULT '✅ ¡Tu hora está confirmada, {{name}}! Te esperamos el {{date}} a las {{time}} hrs.',
  msg_cancelled text NOT NULL DEFAULT 'Hola {{name}}, lamentamos informarte que tu hora del {{date}} {{time}} hrs fue cancelada. Contáctanos para reagendar.',
  msg_reschedule text NOT NULL DEFAULT 'Hola {{name}}, tu hora fue reagendada para el {{date}} a las {{time}} hrs. ¡Te esperamos!',
  msg_reminder text NOT NULL DEFAULT 'Recordatorio ⏰ Hola {{name}}, mañana {{date}} a las {{time}} hrs tienes tu hora agendada. ¡Te esperamos!',
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

-- 2) Columna para no repetir recordatorios
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
