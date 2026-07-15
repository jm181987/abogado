import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { waCreateAndConnect, waStatus, waDisconnect, waTestSend, waResetInstance, waSaveConfig } from "@/lib/whatsapp.functions";

type Cfg = {
  instance_name: string;
  owner_phone: string | null;
  connected: boolean;
  phone_number: string | null;
  msg_new_client: string;
  msg_new_owner: string;
  msg_confirmed: string;
  msg_cancelled: string;
  msg_reschedule: string;
  msg_reminder: string;
};

const TEMPLATE_FIELDS: { key: keyof Cfg; label: string; hint: string }[] = [
 { key: "msg_new_client", label: "Nueva reserva → Cliente", hint: "{{brand}} {{name}} {{date}} {{time}} {{plan}}" },
 { key: "msg_new_owner", label: "Nueva reserva → Dueño", hint: "{{brand}} {{name}} {{phone}} {{date}} {{time}} {{plan}}" },
 { key: "msg_confirmed", label: "Reserva confirmada", hint: "{{brand}} {{name}} {{date}} {{time}}" },
 { key: "msg_cancelled", label: "Reserva cancelada", hint: "{{brand}} {{name}} {{date}} {{time}}" },
 { key: "msg_reschedule", label: "Cambio de horario", hint: "{{brand}} {{name}} {{date}} {{time}}" },
 { key: "msg_reminder", label: "Recordatorio 24h", hint: "{{brand}} {{name}} {{date}} {{time}}" },

];

export function WhatsappTab() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testText, setTestText] = useState("Prueba desde el panel ✅");

  const connect = useServerFn(waCreateAndConnect);
  const refreshStatus = useServerFn(waStatus);
  const disconnect = useServerFn(waDisconnect);
  const testSend = useServerFn(waTestSend);
  const resetInstance = useServerFn(waResetInstance);


  async function loadCfg() {
    const { data } = await supabase.from("whatsapp_config").select("*").eq("id", true).maybeSingle();
    setCfg(data as Cfg | null);
  }
  useEffect(() => { loadCfg(); }, []);

  // Poll status while QR visible
  useEffect(() => {
    if (!qr) return;
    const iv = setInterval(async () => {
      try {
        const r = await refreshStatus();
        if (r.ok && r.state.state === "open") {
          setQr(null);
          setMsg({ kind: "ok", text: "¡WhatsApp conectado!" });
          loadCfg();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(iv);
  }, [qr, refreshStatus]);

  async function handleConnect() {
    setBusy("connect"); setMsg(null);
    try {
      const r = await connect();
      const q = r.qr?.base64 ?? null;
      if (q) setQr(q.startsWith("data:") ? q : `data:image/png;base64,${q}`);
      else setMsg({ kind: "err", text: "No se recibió QR. Revisa el estado." });
      loadCfg();
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally { setBusy(null); }
  }

  async function handleStatus() {
    setBusy("status"); setMsg(null);
    try {
      const r = await refreshStatus();
      if (r.ok) setMsg({ kind: "ok", text: `Estado: ${r.state.state}${r.state.number ? " · " + r.state.number : ""}` });
      else setMsg({ kind: "err", text: r.error });
      loadCfg();
    } finally { setBusy(null); }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar WhatsApp?")) return;
    setBusy("disconnect");
    try { await disconnect(); loadCfg(); setMsg({ kind: "ok", text: "Desconectado" }); }
    finally { setBusy(null); }
  }

  async function handleReset() {
    if (!confirm("Esto borra la instancia en Evolution y la vuelve a crear. ¿Continuar?")) return;
    setBusy("reset"); setMsg(null); setQr(null);
    try {
      const r = await resetInstance();
      if (r.ok) {
        const q = r.qr?.base64 ?? null;
        if (q) setQr(q.startsWith("data:") ? q : `data:image/png;base64,${q}`);
        setMsg({ kind: "ok", text: `Instancia recreada: ${r.instance}. Escanea el QR.` });
      } else {
        setMsg({ kind: "err", text: r.error });
      }
      loadCfg();
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally { setBusy(null); }
  }


  async function saveCfg(patch: Partial<Cfg>) {
    if (!cfg) return;
    const next = { ...cfg, ...patch };
    setCfg(next);
    await supabase.from("whatsapp_config").update(patch).eq("id", true);
  }

  async function handleTest() {
    if (!testTo.trim() || !testText.trim()) return;
    setBusy("test"); setMsg(null);
    try {
      const r = await testSend({ data: { to: testTo, text: testText } });
      setMsg(r.ok ? { kind: "ok", text: "Enviado ✅" } : { kind: "err", text: r.error });
    } finally { setBusy(null); }
  }

  if (!cfg) return <div className="text-sm text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-8">
      {/* Estado */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl">Estado de WhatsApp</h3>
            <p className="text-sm text-muted-foreground">Instancia (auto desde la marca): <code>{cfg.instance_name}</code></p>
          </div>
          <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full ${cfg.connected ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
            {cfg.connected ? `Conectado${cfg.phone_number ? " · " + cfg.phone_number : ""}` : "Desconectado"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!!busy} onClick={handleConnect}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">
            {busy === "connect" ? "Generando QR…" : cfg.connected ? "Renovar QR" : "Conectar WhatsApp"}
          </button>
          <button disabled={!!busy} onClick={handleStatus}
            className="rounded-full border border-input px-4 py-2 text-sm disabled:opacity-50">
            {busy === "status" ? "…" : "Actualizar estado"}
          </button>
          {cfg.connected && (
            <button disabled={!!busy} onClick={handleDisconnect}
              className="rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm disabled:opacity-50">
              Desconectar
            </button>
          )}
          <button disabled={!!busy} onClick={handleReset}
            className="rounded-full border border-amber-500/40 text-amber-700 dark:text-amber-400 px-4 py-2 text-sm disabled:opacity-50">
            {busy === "reset" ? "Reiniciando…" : "Reiniciar instancia"}
          </button>
        </div>

        {msg && (
          <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>{msg.text}</p>
        )}
        {qr && (
          <div className="mt-4 flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40">
            <p className="text-sm text-muted-foreground">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
            <img src={qr} alt="QR de WhatsApp" className="w-64 h-64 rounded-lg bg-white p-2" />
            <p className="text-xs text-muted-foreground">Comprobando conexión cada 3 segundos…</p>
          </div>
        )}
      </section>

      {/* Teléfono del dueño */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-1">WhatsApp del dueño</h3>
        <p className="text-sm text-muted-foreground mb-3">Número que recibirá los avisos de nuevas reservas. Formato internacional con <b>+</b>.</p>
        <input
          value={cfg.owner_phone ?? ""}
          onChange={(e) => setCfg({ ...cfg, owner_phone: e.target.value })}
          onBlur={(e) => saveCfg({ owner_phone: e.target.value.trim() || null })}
          placeholder="+5511987654321"
          className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </section>

      {/* Envío de prueba */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-3">Enviar mensaje de prueba</h3>
        <div className="grid gap-3 md:grid-cols-[1fr,2fr,auto]">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="+5511987654321"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input value={testText} onChange={(e) => setTestText(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={!!busy || !cfg.connected} onClick={handleTest}
            className="rounded-full bg-foreground text-background px-4 py-2 text-sm disabled:opacity-50">
            {busy === "test" ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </section>

      {/* Plantillas */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-1">Plantillas de mensajes</h3>
        <p className="text-sm text-muted-foreground mb-4">Se guardan al salir del campo.</p>
        <div className="grid gap-4">
          {TEMPLATE_FIELDS.map(f => (
            <label key={f.key} className="block">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{f.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{f.hint}</span>
              </div>
              <textarea rows={3} value={cfg[f.key] as string}
                onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}
                onBlur={(e) => saveCfg({ [f.key]: e.target.value } as Partial<Cfg>)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
            </label>
          ))}
        </div>
      </section>

      {/* Cron */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-2">Recordatorios automáticos</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Configura pg_cron (o cualquier scheduler externo) para llamar esta URL cada hora. Envía el recordatorio a las citas <b>confirmadas</b> cuya hora esté entre 23h y 25h desde ahora.
        </p>
        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`POST /api/public/cron/whatsapp-reminders
Header: x-cron-secret: <tu CRON_SECRET>`}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">El valor de <code>CRON_SECRET</code> está en Secrets. Nunca lo compartas públicamente.</p>
      </section>
    </div>
  );
}
