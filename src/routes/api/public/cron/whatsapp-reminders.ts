import { createFileRoute } from "@tanstack/react-router";

/**
 * Recordatorios 24h. Llamar con:
 *   POST /api/public/cron/whatsapp-reminders
 *   Header: x-cron-secret: <CRON_SECRET>
 * Configurable con pg_cron en Supabase apuntando a la URL estable del proyecto.
 */
export const Route = createFileRoute("/api/public/cron/whatsapp-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-cron-secret");
        if (!secret || secret !== process.env.CRON_SECRET) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { createClient } = await import("@supabase/supabase-js");
        const { evoSendText, fillTemplate, formatDateEs, getBrandInfo } = await import("@/lib/whatsapp.server");

        const admin = createClient(
          process.env.APP_SUPABASE_URL!,
          process.env.APP_SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
        if (!cfg?.connected) return Response.json({ ok: false, error: "WhatsApp no conectado" });

        const brand = await getBrandInfo(admin);
        const now = Date.now();
        const start = new Date(now + 23 * 60 * 60 * 1000).toISOString();
        const end = new Date(now + 25 * 60 * 60 * 1000).toISOString();

        const { data: appts } = await admin.from("appointments")
          .select("id, name, phone, scheduled_at, plans:plan_id(name_es)")
          .gte("scheduled_at", start)
          .lte("scheduled_at", end)
          .eq("status", "confirmed")
          .is("reminder_sent_at", null);

        const results: { id: string; ok: boolean; error?: string }[] = [];
        for (const a of appts ?? []) {
          if (!a.scheduled_at || !a.phone) continue;
          const { date, time } = formatDateEs(a.scheduled_at);
          const vars = {
            name: a.name ?? "",
            phone: a.phone ?? "",
            date, time,
            plan: (a as any).plans?.name_es ?? "",
            brand: brand.name,
          };
          try {
            await evoSendText(brand.slug, a.phone, fillTemplate(cfg.msg_reminder, vars));
            await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", a.id);
            results.push({ id: a.id, ok: true });
          } catch (e) {
            results.push({ id: a.id, ok: false, error: (e as Error).message });
          }
        }
        return Response.json({ ok: true, sent: results.filter(r => r.ok).length, total: results.length, results });

      },
    },
  },
});
