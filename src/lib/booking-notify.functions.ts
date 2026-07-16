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
    const { evoSendText, fillTemplate, formatDateForLang, getBrandInfo, pickClientLang, pickTemplate } = await import("./whatsapp.server");

    const admin = createClient(
      process.env.APP_SUPABASE_URL!,
      process.env.APP_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: appt } = await admin.from("appointments")
      .select("id, name, phone, scheduled_at, created_at, plans:plan_id(name_es, name_pt)")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt || !appt.scheduled_at) return { ok: false as const, error: "Cita no encontrada" };

    const ageMs = Date.now() - new Date(appt.created_at).getTime();
    if (ageMs > 5 * 60 * 1000) return { ok: false as const, error: "Cita demasiado antigua" };

    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
    if (!cfg?.connected) return { ok: false as const, error: "WhatsApp no conectado" };

    const brand = await getBrandInfo(admin);
    const clientLang = pickClientLang(appt.phone);
    const planName = clientLang === "pt"
      ? ((appt as any).plans?.name_pt ?? (appt as any).plans?.name_es ?? "Sem preferência")
      : ((appt as any).plans?.name_es ?? "Sin preferencia");
    const { date: cDate, time: cTime } = formatDateForLang(appt.scheduled_at, clientLang);
    const clientVars = {
      name: appt.name ?? "",
      phone: appt.phone ?? "",
      date: cDate, time: cTime,
      plan: planName,
      brand: brand.name,
    };
    // Dueño: idioma según su propio teléfono
    const ownerLang = pickClientLang(cfg.owner_phone);
    const { date: oDate, time: oTime } = formatDateForLang(appt.scheduled_at, ownerLang);
    const ownerPlanName = ownerLang === "pt"
      ? ((appt as any).plans?.name_pt ?? (appt as any).plans?.name_es ?? "Sem preferência")
      : ((appt as any).plans?.name_es ?? "Sin preferencia");
    const ownerVars = {
      name: appt.name ?? "",
      phone: appt.phone ?? "",
      date: oDate, time: oTime,
      plan: ownerPlanName,
      brand: brand.name,
    };

    const results = { client: false, owner: false, errors: [] as string[] };
    try {
      const tpl = pickTemplate(cfg as any, "msg_new_client", clientLang);
      await evoSendText(brand.instance, appt.phone, fillTemplate(tpl, clientVars));
      results.client = true;
    } catch (e) { results.errors.push(`cliente: ${(e as Error).message}`); }

    if (cfg.owner_phone) {
      try {
        const ownerTpl = pickTemplate(cfg as any, "msg_new_owner", ownerLang);
        await evoSendText(brand.instance, cfg.owner_phone, fillTemplate(ownerTpl, ownerVars));
        results.owner = true;
      } catch (e) { results.errors.push(`dueño: ${(e as Error).message}`); }
    }
    return { ok: true as const, results };
  });

