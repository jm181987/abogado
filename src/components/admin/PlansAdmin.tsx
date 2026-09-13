import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dataClient } from "@/lib/data-client";
import type { Lang } from "@/lib/i18n";

type Plan = {
  id: string;
  name_es: string;
  name_pt: string;
  age_es: string;
  age_pt: string;
  price: string;
  old_price: string;
  features_es: string[];
  features_pt: string[];
  sort_order: number;
  popular: boolean;
  active: boolean;
};

const ui = (lang: Lang, es: string, pt: string) => lang === "pt" ? pt : es;

export function PlansAdmin({ lang }: { lang: Lang }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function load() {
    setLoading(true);
    const { data, error } = await dataClient.from("plans").select("*").order("sort_order");
    if (error) alert(ui(lang, "Error cargando planes: ", "Erro ao carregar planos: ") + error.message);
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function refreshSiteContent() {
    await queryClient.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function save(plan: Plan) {
    setSaving(plan.id);
    const { error } = await dataClient.from("plans").update({
      name_es: plan.name_es,
      name_pt: plan.name_pt,
      age_es: plan.age_es,
      age_pt: plan.age_pt,
      price: plan.price,
      old_price: plan.old_price,
      features_es: plan.features_es,
      features_pt: plan.features_pt,
      popular: plan.popular,
      sort_order: plan.sort_order,
      active: plan.active,
      updated_at: new Date().toISOString(),
    }).eq("id", plan.id);
    setSaving(null);
    if (error) {
      alert(ui(lang, "Error guardando: ", "Erro ao salvar: ") + error.message);
      return;
    }
    await refreshSiteContent();
  }

  function update(id: string, patch: Partial<Plan>) {
    setPlans(prev => prev.map(plan => plan.id === id ? { ...plan, ...patch } : plan));
  }

  async function addPlan() {
    const nextOrder = plans.length ? Math.max(...plans.map(plan => plan.sort_order ?? 0)) + 1 : 1;
    const { error } = await dataClient.from("plans").insert({
      name_es: "Nuevo plan",
      name_pt: "Novo plano",
      age_es: "",
      age_pt: "",
      price: "R$ 0",
      old_price: "",
      features_es: [],
      features_pt: [],
      popular: false,
      sort_order: nextOrder,
      active: true,
    } as any);
    if (error) {
      alert(ui(lang, "Error creando plan: ", "Erro ao criar plano: ") + error.message);
      return;
    }
    await load();
    await refreshSiteContent();
  }

  async function remove(plan: Plan) {
    if (!confirm(ui(lang, `¿Eliminar el plan "${plan.name_es}"? Esta acción no se puede deshacer.`, `Excluir o plano "${plan.name_pt || plan.name_es}"? Esta ação não pode ser desfeita.`))) return;
    const { error } = await dataClient.from("plans").delete().eq("id", plan.id);
    if (error) {
      alert(ui(lang, "Error eliminando: ", "Erro ao excluir: ") + error.message);
      return;
    }
    await load();
    await refreshSiteContent();
  }

  if (loading) return <p className="text-sm text-muted-foreground">{ui(lang, "Cargando…", "Carregando…")}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">{ui(lang, "Planes y servicios", "Planos e serviços")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{plans.length} {ui(lang, "plan(es). Solo los activos aparecen en el sitio.", "plano(s). Apenas os ativos aparecem no site.")}</p>
        </div>
        <button onClick={addPlan} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm">+ {ui(lang, "Nuevo plan", "Novo plano")}</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map(plan => (
          <div key={plan.id} className={`rounded-2xl border p-5 space-y-4 ${plan.active ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-75"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={plan.name_es} onChange={e => update(plan.id, { name_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre (ES)" />
              <input value={plan.name_pt} onChange={e => update(plan.id, { name_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Nome (PT)" />
              <input value={plan.age_es} onChange={e => update(plan.id, { age_es: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción breve (ES)" />
              <input value={plan.age_pt} onChange={e => update(plan.id, { age_pt: e.target.value })} className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Descrição breve (PT)" />
              <label className="text-xs text-muted-foreground">{ui(lang, "Precio", "Preço")}<input value={plan.price} onChange={e => update(plan.id, { price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <label className="text-xs text-muted-foreground">{ui(lang, "Precio anterior", "Preço anterior")}<input value={plan.old_price ?? ""} onChange={e => update(plan.id, { old_price: e.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <label className="text-xs text-muted-foreground">{ui(lang, "Orden", "Ordem")}<input type="number" value={plan.sort_order} onChange={e => update(plan.id, { sort_order: Number(e.target.value) })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
            </div>

            <label className="block text-xs text-muted-foreground">{ui(lang, "Características (ES) — una por línea", "Características (ES) — uma por linha")}<textarea value={(plan.features_es ?? []).join("\n")} onChange={e => update(plan.id, { features_es: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-muted-foreground">{ui(lang, "Características (PT) — una por línea", "Características (PT) — uma por linha")}<textarea value={(plan.features_pt ?? []).join("\n")} onChange={e => update(plan.id, { features_pt: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.popular} onChange={e => update(plan.id, { popular: e.target.checked })} />{ui(lang, "Más popular", "Mais popular")}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.active} onChange={e => update(plan.id, { active: e.target.checked })} />{ui(lang, "Activo", "Ativo")}</label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => remove(plan)} className="min-h-10 rounded-lg border border-destructive/30 px-4 text-xs font-bold text-destructive">{ui(lang, "Eliminar", "Excluir")}</button>
                <button onClick={() => save(plan)} disabled={saving === plan.id} className="min-h-10 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving === plan.id ? ui(lang, "Guardando…", "Salvando…") : ui(lang, "Guardar", "Salvar")}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
