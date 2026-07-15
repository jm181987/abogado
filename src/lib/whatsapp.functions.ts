import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const waCreateAndConnect = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoCreateInstance, evoInstanceExists, evoConnect, evoState, getBrandInfo } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const brand = await getBrandInfo(admin);
  const name = brand.slug;
  try {
    const exists = await evoInstanceExists(name);
    if (!exists) await evoCreateInstance(name);
  } catch (e) {
    console.warn("[wa] create/fetch:", (e as Error).message);
  }
  const qr = await evoConnect(name);
  const state = await evoState(name);
  await admin.from("whatsapp_config").update({
    instance_name: name,
    connected: state.state === "open",
    phone_number: state.number ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  return { ok: true as const, instance: name, brand: brand.name, qr, state };
});

export const waStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoState, getBrandInfo } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const brand = await getBrandInfo(admin);
  const name = brand.slug;
  try {
    const state = await evoState(name);
    await admin.from("whatsapp_config").update({
      instance_name: name,
      connected: state.state === "open",
      phone_number: state.number ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    return { ok: true as const, state, instance: name, brand: brand.name };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
});

export const waDisconnect = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoLogout, getBrandInfo } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const brand = await getBrandInfo(admin);
  const name = brand.slug;
  try {
    await evoLogout(name);
  } catch (e) {
    console.warn("[wa] logout:", (e as Error).message);
  }
  await admin.from("whatsapp_config").update({ connected: false, phone_number: null }).eq("id", true);
  return { ok: true as const };
});

export const waSaveConfig = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    owner_phone: z.string().trim().max(30).nullable().optional(),
    msg_new_client: z.string().max(2000).optional(),
    msg_new_owner: z.string().max(2000).optional(),
    msg_confirmed: z.string().max(2000).optional(),
    msg_cancelled: z.string().max(2000).optional(),
    msg_reschedule: z.string().max(2000).optional(),
    msg_reminder: z.string().max(2000).optional(),
    msg_new_client_pt: z.string().max(2000).optional(),
    msg_confirmed_pt: z.string().max(2000).optional(),
    msg_cancelled_pt: z.string().max(2000).optional(),
    msg_reschedule_pt: z.string().max(2000).optional(),
    msg_reminder_pt: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
    await requireAdmin();
    const admin = getAdminSupabase();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) patch[k] = v;
    }
    const { error } = await admin.from("whatsapp_config").update(patch).eq("id", true);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Borra la instancia en Evolution y la vuelve a crear. Útil para recuperarse
 *  de estados rotos (error 1003, sesión Baileys corrupta, cambio de marca). */
export const waResetInstance = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
  const { evoDelete, evoLogout, evoCreateInstance, evoConnect, evoState, getBrandInfo } = await import("./whatsapp.server");
  await requireAdmin();
  const admin = getAdminSupabase();
  const brand = await getBrandInfo(admin);
  const name = brand.slug;

  // Intentar logout + delete de la instancia actual (aunque no exista)
  try { await evoLogout(name); } catch (e) { console.warn("[wa] reset/logout:", (e as Error).message); }
  try { await evoDelete(name); } catch (e) { console.warn("[wa] reset/delete:", (e as Error).message); }

  // También limpiar el instance_name anterior si era distinto
  const { data: cfg } = await admin.from("whatsapp_config").select("instance_name").eq("id", true).maybeSingle();
  const prev = cfg?.instance_name;
  if (prev && prev !== name) {
    try { await evoLogout(prev); } catch (e) { console.warn("[wa] reset/logout prev:", (e as Error).message); }
    try { await evoDelete(prev); } catch (e) { console.warn("[wa] reset/delete prev:", (e as Error).message); }
  }

  // Recrear + conectar
  try { await evoCreateInstance(name); } catch (e) {
    console.error("[wa] reset/create:", (e as Error).message);
    return { ok: false as const, error: `No se pudo crear la instancia: ${(e as Error).message}` };
  }
  const qr = await evoConnect(name);
  const state = await evoState(name);
  await admin.from("whatsapp_config").update({
    instance_name: name,
    connected: state.state === "open",
    phone_number: state.number ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  return { ok: true as const, instance: name, brand: brand.name, qr, state };
});


export const waTestSend = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ to: z.string().min(6), text: z.string().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, getAdminSupabase } = await import("./admin-auth.server");
    const { evoSendText, getBrandInfo } = await import("./whatsapp.server");
    await requireAdmin();
    const admin = getAdminSupabase();
    const brand = await getBrandInfo(admin);
    const name = brand.slug;
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
    const { evoSendText, fillTemplate, formatDateForLang, getBrandInfo, pickClientLang, pickTemplate } = await import("./whatsapp.server");
    await requireAdmin();
    const admin = getAdminSupabase();
    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
    if (!cfg?.connected) return { ok: false as const, error: "WhatsApp no conectado" };
    const brand = await getBrandInfo(admin);
    const { data: appt } = await admin.from("appointments")
      .select("id, name, phone, scheduled_at, plan_id, plans:plan_id(name_es, name_pt)")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt || !appt.scheduled_at) return { ok: false as const, error: "Cita no encontrada" };
    const lang = pickClientLang(appt.phone);
    const { date, time } = formatDateForLang(appt.scheduled_at, lang);
    const planName = lang === "pt"
      ? ((appt as any).plans?.name_pt ?? (appt as any).plans?.name_es ?? "")
      : ((appt as any).plans?.name_es ?? "");
    const vars = {
      name: appt.name ?? "",
      phone: appt.phone ?? "",
      date, time,
      plan: planName,
      brand: brand.name,
    };
    const baseKey = data.kind === "confirmed" ? "msg_confirmed"
      : data.kind === "cancelled" ? "msg_cancelled"
      : "msg_reschedule";
    const tpl = pickTemplate(cfg as any, baseKey, lang);
    try {
      await evoSendText(brand.slug, appt.phone, fillTemplate(tpl, vars));
      return { ok: true as const };
    } catch (e) {
      console.error("[wa] notify status:", (e as Error).message);
      return { ok: false as const, error: (e as Error).message };
    }
  });
