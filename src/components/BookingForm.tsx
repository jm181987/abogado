import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PlanOpt = { id: string; name: string };

export function BookingForm() {
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan_id: "", preferred_date: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("plans").select("id, name").order("position").then(({ data }) => {
      setPlans((data as PlanOpt[]) ?? []);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending"); setErr(null);
    const payload = { ...form, plan_id: form.plan_id || null, preferred_date: form.preferred_date || null, status: "pending" as const };
    const { error } = await supabase.from("appointments").insert(payload);
    if (error) { setErr(error.message); setState("error"); return; }
    setState("sent");
    setForm({ name: "", email: "", phone: "", plan_id: "", preferred_date: "", message: "" });
  }

  return (
    <section id="agendar" className="py-24 md:py-32 bg-muted/40">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Agendar</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tight mb-4">Reserva tu evaluación</h2>
        <p className="text-muted-foreground mb-10">Déjanos tus datos y te contactamos para coordinar tu hora.</p>

        {state === "sent" ? (
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h3 className="font-display text-2xl mb-2">¡Recibida!</h3>
            <p className="text-muted-foreground">Te contactaremos pronto por WhatsApp o email.</p>
            <button onClick={() => setState("idle")} className="mt-6 text-sm text-primary hover:underline">
              Enviar otra solicitud
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div>
              <label className="block text-xs font-medium mb-1.5">Nombre completo</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Teléfono</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Plan de interés (opcional)</label>
              <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                <option value="">Sin preferencia</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Fecha preferida (opcional)</label>
              <input type="text" placeholder="Ej: Lunes por la tarde, 15 de marzo AM…"
                value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Mensaje (opcional)</label>
              <textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            {err && <p className="md:col-span-2 text-sm text-destructive">{err}</p>}
            <div className="md:col-span-2">
              <button disabled={state === "sending"} type="submit"
                className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-medium disabled:opacity-50">
                {state === "sending" ? "Enviando…" : "Solicitar hora"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
