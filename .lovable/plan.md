
## Alcance

Integrar Evolution API (self-hosted) para que el dueño conecte su WhatsApp escaneando un QR desde `/admin`, y desde esa instancia se envíen mensajes automáticos al cliente y al dueño.

## Configuración inicial

Pediré dos secretos:
- `EVOLUTION_API_URL` — base URL del servidor Evolution (ej. `https://evo.midominio.com`)
- `EVOLUTION_API_KEY` — APIKEY global del servidor

Y una nueva tabla `whatsapp_config` (un solo registro, editable desde admin):
- `instance_name` (fijo, ej. `vizcaya-salud`)
- `owner_phone` — WhatsApp del dueño en formato internacional para recibir avisos
- `connected` — booleano cacheado
- `phone_number` — número conectado (informativo)
- Plantillas de mensaje editables: `msg_new_client`, `msg_new_owner`, `msg_confirmed`, `msg_cancelled`, `msg_reschedule`, `msg_reminder` con placeholders `{{name}} {{date}} {{time}} {{plan}}`.

## Backend (server functions y route)

`src/lib/whatsapp.functions.ts` (admin-only, con `requireSupabaseAuth` + verificación `has_role admin`):
- `waCreateAndConnect()` — llama Evolution `POST /instance/create` (si no existe) y `GET /instance/connect/{name}`, devuelve `{ base64, pairingCode }` del QR.
- `waStatus()` — `GET /instance/connectionState/{name}`, actualiza `whatsapp_config.connected`.
- `waDisconnect()` — `DELETE /instance/logout/{name}`.
- `waTestSend({ to, text })` — para probar desde admin.
- `waNotifyStatusChange({ appointmentId })` — usa `admin_supabase`, lee cita, envía mensaje según `status`.

`src/lib/whatsapp.server.ts` — helper `sendMessage(to, text)` que hace `POST /message/sendText/{name}` firmado con `apikey` header. Normaliza teléfono (quita `+`, espacios).

`src/lib/booking.functions.ts` (público, sin auth):
- `notifyNewBooking({ appointmentId })` — server fn llamada desde `BookingForm` justo después del insert. Verifica que la cita existe y es reciente (<2 min) para evitar spam; envía mensaje al cliente y al dueño.

`src/routes/api/public/cron/whatsapp-reminders.ts` — endpoint protegido con `x-cron-secret` (secreto generado). Busca citas confirmadas entre 23h y 25h a futuro sin `reminder_sent_at`, envía recordatorio y marca. Se documenta en el admin cómo llamarlo con pg_cron.

## UI Admin (nueva pestaña "WhatsApp")

- Estado de conexión con badge.
- Botón **Conectar / Renovar QR** → muestra QR (base64) en modal, refresca estado cada 3s hasta `open`.
- Campo `owner_phone` con selector de país (reutilizando el que hicimos en `BookingForm`).
- Editor de plantillas (textarea por cada evento).
- Botón **Enviar mensaje de prueba**.
- Instrucciones para pg_cron con la URL del recordatorio y el secreto.

## Disparadores conectados

- `BookingForm.tsx` — después de `insert appointments` exitoso, llama `notifyNewBooking({ appointmentId })`. No bloquea el `sent` state si falla el WhatsApp (se loggea).
- `admin.tsx` (AppointmentsTab `patch`) — al cambiar `status` a `confirmed` / `cancelled`, o al cambiar `scheduled_at`, llama `waNotifyStatusChange`.

## Detalles técnicos

- Todas las llamadas a Evolution se hacen server-side; el APIKEY nunca llega al navegador.
- Normalización de teléfonos: se usa el valor ya guardado con `+<código><número>`; para Evolution se envía sin `+`.
- Errores del proveedor se loggean con `console.error` y se devuelven en `{ ok:false, error }` para mostrar al admin sin romper el flujo.
- Migración SQL: crea `whatsapp_config`, agrega columna `reminder_sent_at timestamptz` a `appointments`, y una fila semilla de `whatsapp_config` con plantillas por defecto en español.

## No incluido (fuera de alcance)

- Respuestas automáticas entrantes (webhooks) — quedan para después.
- Multi-instancia por admin.
</content>
</invoke>