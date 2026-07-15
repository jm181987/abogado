import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Notifica creación de reserva. Público — se llama justo después del insert.
 * Anti-spam: solo envía si la cita existe, se creó hace <5 min y no fue notificada.
 */
export const notifyNewBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { evoSendText, fillTemplate, formatDateEs, getBrandInfo } = await import("./whatsapp.server");

    const admin = createClient(
      process.env.APP_SUPABASE_URL!,
      process.env.APP_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: appt } = await admin.from("appointments")
      .select("id, name, phone, scheduled_at, created_at, plans:plan_id(name_es)")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt || !appt.scheduled_at) return { ok: false as const, error: "Cita no encontrada" };

    const ageMs = Date.now() - new Date(appt.created_at).getTime();
    if (ageMs > 5 * 60 * 1000) return { ok: false as const, error: "Cita demasiado antigua" };

    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
    if (!cfg?.connected) return { ok: false as const, error: "WhatsApp no conectado" };

    const brand = await getBrandInfo(admin);
    const { date, time } = formatDateEs(appt.scheduled_at);
    const vars = {
      name: appt.name ?? "",
      phone: appt.phone ?? "",
      date, time,
      plan: (appt as any).plans?.name_es ?? "Sin preferencia",
      brand: brand.name,
    };

    const results = { client: false, owner: false, errors: [] as string[] };
    try {
      await evoSendText(brand.slug, appt.phone, fillTemplate(cfg.msg_new_client, vars));
      results.client = true;
    } catch (e) { results.errors.push(`cliente: ${(e as Error).message}`); }

    if (cfg.owner_phone) {
      try {
        await evoSendText(brand.slug, cfg.owner_phone, fillTemplate(cfg.msg_new_owner, vars));
        results.owner = true;
      } catch (e) { results.errors.push(`dueño: ${(e as Error).message}`); }
    }
    return { ok: true as const, results };
  });

