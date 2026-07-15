import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type PlanOpt = { id: string; name: string };

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

type CountryCode = "55" | "598" | "56" | "54" | "51";
const COUNTRIES: { code: CountryCode; label: string; flag: string; placeholder: string; hint: string }[] = [
  { code: "55", label: "Brasil", flag: "🇧🇷", placeholder: "11 98765 4321", hint: "DDD + número (agregamos el 9 si falta)" },
  { code: "598", label: "Uruguay", flag: "🇺🇾", placeholder: "99123456", hint: "Sin el 0 inicial" },
  { code: "56", label: "Chile", flag: "🇨🇱", placeholder: "9 1234 5678", hint: "" },
  { code: "54", label: "Argentina", flag: "🇦🇷", placeholder: "11 1234 5678", hint: "" },
  { code: "51", label: "Perú", flag: "🇵🇪", placeholder: "912 345 678", hint: "" },
];

function normalizePhone(country: CountryCode, raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (country === "598") {
    // Uruguay: quitar 0 inicial
    digits = digits.replace(/^0+/, "");
  } else if (country === "55") {
    // Brasil: DDD (2) + 9 + número. Insertar 9 si falta tras el DDD.
    digits = digits.replace(/^0+/, "");
    if (digits.length >= 3 && digits[2] !== "9") {
      digits = digits.slice(0, 2) + "9" + digits.slice(2);
    }
  } else {
    digits = digits.replace(/^0+/, "");
  }
  return `+${country}${digits}`;
}

const schema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(6, "Teléfono inválido").max(30),
  country: z.enum(["55", "598", "56", "54", "51"]),
  date: z.string().min(1, "Elige una fecha"),
  time: z.string().min(1, "Elige una hora"),
  plan_id: z.string().optional(),
  message: z.string().max(1000).optional(),
});

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BookingForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "55" as CountryCode, plan_id: "", date: "", time: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    supabase.from("plans").select("id, name").order("position").then(({ data }) => {
      setPlans((data as PlanOpt[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (!form.date) { setBookedTimes(new Set()); return; }
    setLoadingSlots(true);
    // Traer también reservas del día anterior por si su duración se extiende al día seleccionado
    const start = new Date(`${form.date}T00:00:00`);
    const end = new Date(`${form.date}T23:59:59`);
    const queryStart = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const queryEnd = end.toISOString();
    const newBookingDuration = 60; // duración por defecto de nuevas reservas
    supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes, status")
      .gte("scheduled_at", queryStart)
      .lte("scheduled_at", queryEnd)
      .neq("status", "cancelled")
      .then(({ data }) => {
        const taken = new Set<string>();
        const rows = (data as { scheduled_at: string; duration_minutes: number | null }[]) ?? [];
        for (const slot of TIME_SLOTS) {
          const slotStart = new Date(`${form.date}T${slot}:00`).getTime();
          for (const row of rows) {
            const bStart = new Date(row.scheduled_at).getTime();
            const bEnd = bStart + (row.duration_minutes ?? 60) * 60 * 1000;
            // bloquear solo si el inicio del slot cae dentro de una reserva existente
            if (slotStart >= bStart && slotStart < bEnd) {
              taken.add(slot);
              break;
            }
          }
        }
        setBookedTimes(taken);
        setLoadingSlots(false);
        setForm(f => (f.time && taken.has(f.time) ? { ...f, time: "" } : f));
      });
  }, [form.date]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const minDate = useMemo(() => todayStr(), []);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerErr(null); setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[String(issue.path[0])] = issue.message;
      setErrors(fe);
      return;
    }
    setState("sending");
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();

    const newDuration = 60;
    const newStart = new Date(scheduledAt).getTime();
    const newEnd = newStart + newDuration * 60 * 1000;
    const rangeStart = new Date(newStart - 24 * 60 * 60 * 1000).toISOString();
    const rangeEnd = new Date(newEnd).toISOString();

    // Revalidar disponibilidad considerando solape con duración
    const { data: nearby } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd)
      .neq("status", "cancelled");
    const clash = (nearby ?? []).some(r => {
      const bStart = new Date(r.scheduled_at as string).getTime();
      const bEnd = bStart + ((r.duration_minutes as number | null) ?? 60) * 60 * 1000;
      // el inicio de la nueva reserva cae dentro de una existente
      return newStart >= bStart && newStart < bEnd;
    });
    if (clash) {
      setServerErr("Ese horario acaba de ser reservado o se solapa con otra reserva. Elige otro.");
      setBookedTimes(prev => new Set(prev).add(form.time));
      setForm(f => ({ ...f, time: "" }));
      setState("error");
      return;
    }

    const payload = {
      name: parsed.data.name,
      full_name: parsed.data.name,
      email: parsed.data.email,
      phone: normalizePhone(form.country, form.phone),
      plan_id: form.plan_id || null,
      scheduled_at: scheduledAt,
      duration_minutes: 60,
      message: form.message.trim() || null,
      status: "pending" as const,
    };
    const { error } = await supabase.from("appointments").insert(payload);
    if (error) { setServerErr(error.message); setState("error"); return; }
    setState("sent");
    setForm({ name: "", email: "", phone: "", country: "55", plan_id: "", date: "", time: "", message: "" });
  }

  function handleClose() {
    onClose();
    setTimeout(() => { setState("idle"); setErrors({}); setServerErr(null); }, 200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button
        aria-label="Cerrar"
        onClick={handleClose}
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/70 text-foreground transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" /></svg>
        </button>

        <div className="p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Agendar</p>
          <h2 id="booking-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">Reserva tu hora</h2>
          <p className="text-muted-foreground text-sm mb-6">Elige el día y hora que prefieras. Confirmamos por WhatsApp.</p>

          {state === "sent" ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
              <h3 className="font-display text-2xl mb-2">¡Solicitud recibida!</h3>
              <p className="text-muted-foreground">Te confirmaremos por WhatsApp en las próximas horas.</p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => setState("idle")} className="text-sm text-primary hover:underline">Agendar otra</button>
                <button onClick={handleClose} className="rounded-full bg-foreground text-background px-5 py-2 text-sm">Cerrar</button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre completo" error={errors.name}>
                <input maxLength={100} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </Field>
              <Field label="WhatsApp" full error={errors.phone}>
                {(() => {
                  const c = COUNTRIES.find(x => x.code === form.country)!;
                  return (
                    <>
                      <div className="flex gap-2">
                        <select
                          value={form.country}
                          onChange={e => setForm({ ...form, country: e.target.value as CountryCode })}
                          className="rounded-lg border border-input bg-background px-2 py-2.5 text-sm"
                          aria-label="País"
                        >
                          {COUNTRIES.map(co => (
                            <option key={co.code} value={co.code}>{co.flag} +{co.code}</option>
                          ))}
                        </select>
                        <input
                          maxLength={30} required inputMode="tel"
                          placeholder={c.placeholder}
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^\d\s()-]/g, "") })}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Se guardará como <b>{normalizePhone(form.country, form.phone || "")}</b>
                        {c.hint ? ` · ${c.hint}` : ""}
                      </p>
                    </>
                  );
                })()}
              </Field>
              <Field label="Email" full error={errors.email}>
                <input maxLength={255} required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Fecha" error={errors.date}>
                <input type="date" required min={minDate} value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Hora" error={errors.time}>
                <select required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                  disabled={!form.date || loadingSlots}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-60">
                  <option value="">
                    {!form.date ? "Elige una fecha primero" : loadingSlots ? "Cargando horarios…" : "Selecciona una hora"}
                  </option>
                  {TIME_SLOTS.map(s => {
                    const taken = bookedTimes.has(s);
                    return (
                      <option key={s} value={s} disabled={taken}>
                        {s} hrs{taken ? " — no disponible" : ""}
                      </option>
                    );
                  })}
                </select>
                {form.date && !loadingSlots && bookedTimes.size > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{bookedTimes.size} horario(s) ya reservados ese día.</p>
                )}
              </Field>
              <Field label="Plan de interés (opcional)" full>
                <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                  <option value="">Sin preferencia</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Mensaje (opcional)" full error={errors.message}>
                <textarea maxLength={1000} rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </Field>
              {serverErr && <p className="md:col-span-2 text-sm text-destructive">{serverErr}</p>}
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground max-w-xs">Queda como <b>pendiente</b> hasta que confirmemos disponibilidad.</p>
                <button disabled={state === "sending"} type="submit"
                  className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-medium disabled:opacity-50">
                  {state === "sending" ? "Enviando…" : "Solicitar hora"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
