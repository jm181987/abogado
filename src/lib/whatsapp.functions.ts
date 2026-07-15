import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const waCreateAndConnect = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoCreateInstance, evoInstanceExists, evoConnect, evoState } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const { data: cfg } = await admin.from("whatsapp_config").select("instance_name").eq("id", true).maybeSingle();
  const name = cfg?.instance_name ?? "vizcaya-salud";
  try {
    const exists = await evoInstanceExists(name);
    if (!exists) await evoCreateInstance(name);
  } catch (e) {
    // continuar: puede que exista y fetchInstances haya fallado
    console.warn("[wa] create/fetch:", (e as Error).message);
  }
  const qr = await evoConnect(name);
  const state = await evoState(name);
  await admin.from("whatsapp_config").update({
    connected: state.state === "open",
    phone_number: state.number ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  return { ok: true as const, instance: name, qr, state };
});

export const waStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoState } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const { data: cfg } = await admin.from("whatsapp_config").select("instance_name").eq("id", true).maybeSingle();
  const name = cfg?.instance_name ?? "vizcaya-salud";
  try {
    const state = await evoState(name);
    await admin.from("whatsapp_config").update({
      connected: state.state === "open",
      phone_number: state.number ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    return { ok: true as const, state };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
});

export const waDisconnect = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoLogout } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const { data: cfg } = await admin.from("whatsapp_config").select("instance_name").eq("id", true).maybeSingle();
  const name = cfg?.instance_name ?? "vizcaya-salud";
  try {
    await evoLogout(name);
  } catch (e) {
    console.warn("[wa] logout:", (e as Error).message);
  }
  await admin.from("whatsapp_config").update({ connected: false, phone_number: null }).eq("id", true);
  return { ok: true as const };
});

export const waTestSend = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ to: z.string().min(6), text: z.string().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
    const { evoSendText } = await import("./whatsapp.server");
    await requireAdmin();
    const admin = getAdminSupabase();
    const { data: cfg } = await admin.from("whatsapp_config").select("instance_name").eq("id", true).maybeSingle();
    const name = cfg?.instance_name ?? "vizcaya-salud";
    try {
      await evoSendText(name, data.to, data.text);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });

export const waNotifyStatusChange = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    appointmentId: z.string().uuid(),
    kind: z.enum(["confirmed", "cancelled", "reschedule"]),
  }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
    const { evoSendText, fillTemplate, formatDateEs } = await import("./whatsapp.server");
    await requireAdmin();
    const admin = getAdminSupabase();
    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
    if (!cfg?.connected) return { ok: false as const, error: "WhatsApp no conectado" };
    const { data: appt } = await admin.from("appointments")
      .select("id, name, phone, scheduled_at, plan_id, plans:plan_id(name_es)")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt || !appt.scheduled_at) return { ok: false as const, error: "Cita no encontrada" };
    const { date, time } = formatDateEs(appt.scheduled_at);
    const vars = {
      name: appt.name ?? "",
      phone: appt.phone ?? "",
      date, time,
      plan: (appt as any).plans?.name_es ?? "",
    };
    const tpl = data.kind === "confirmed" ? cfg.msg_confirmed
      : data.kind === "cancelled" ? cfg.msg_cancelled
      : cfg.msg_reschedule;
    try {
      await evoSendText(cfg.instance_name, appt.phone, fillTemplate(tpl, vars));
      return { ok: true as const };
    } catch (e) {
      console.error("[wa] notify status:", (e as Error).message);
      return { ok: false as const, error: (e as Error).message };
    }
  });
