import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import { PRACTICE_AREAS_DEFAULTS, type PracticeAreasData } from "@/components/PracticeAreasSection";
import { ProfessionalsAdmin } from "@/components/admin/ProfessionalsAdmin";

const ui=(lang:Lang,es:string,pt:string)=>lang==="pt"?pt:es;

export function PracticeAreasAdmin({ lang }: { lang: Lang }) {
  const [editLang,setEditLang]=useState<Lang>(lang);
  const [data,setData]=useState<PracticeAreasData>(PRACTICE_AREAS_DEFAULTS[lang]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const queryClient=useQueryClient();
  useEffect(()=>setEditLang(lang),[lang]);
  useEffect(()=>{void load(editLang)},[editLang]);

  async function load(l:Lang){
    const {data:row}=await supabase.from("site_content").select("data").eq("lang",l).maybeSingle();
    const stored=(row?.data as any)?.practiceAreas;
    setData(stored?.items?.length?stored:PRACTICE_AREAS_DEFAULTS[l]);
  }
  function patch(p:Partial<PracticeAreasData>){setData(v=>({...v,...p}));}
  function patchItem(i:number,p:Record<string,any>){setData(v=>({...v,items:v.items.map((it,index)=>index===i?{...it,...p}:it)}));}
  async function save(){
    setSaving(true);setSaved(false);
    const {data:row}=await supabase.from("site_content").select("data").eq("lang",editLang).maybeSingle();
    const current=(row?.data as any)??{};
    const {error}=await supabase.from("site_content").upsert({lang:editLang,data:{...current,practiceAreas:data},updated_at:new Date().toISOString()},{onConflict:"lang"});
    setSaving(false);
    if(error){alert(error.message);return;}
    await queryClient.invalidateQueries({queryKey:["site_content"]});
    setSaved(true);setTimeout(()=>setSaved(false),1800);
  }
  function add(){setData(v=>({...v,items:[...v.items,{title:ui(editLang,"Nueva área","Nova área"),description:"",matters:[]}]}));}
  function remove(i:number){setData(v=>({...v,items:v.items.filter((_,index)=>index!==i)}));}

  return <div className="space-y-10">
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">{ui(lang,"Áreas de Actuación","Áreas de Atuação")}</h2><p className="mt-1 text-xs text-muted-foreground">{ui(lang,"Edita exactamente la sección publicada en la homepage.","Edite exatamente a seção publicada na homepage.")}</p></div><div className="flex items-center gap-2"><button onClick={()=>setEditLang("es")} className={`rounded-full px-3 py-2 text-xs font-bold ${editLang==="es"?"bg-foreground text-background":"border border-border"}`}>ES</button><button onClick={()=>setEditLang("pt")} className={`rounded-full px-3 py-2 text-xs font-bold ${editLang==="pt"?"bg-foreground text-background":"border border-border"}`}>PT</button></div></div></div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4"><label className="block text-xs text-muted-foreground">Kicker<input value={data.kicker} onChange={e=>patch({kicker:e.target.value})} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3"/></label><label className="block text-xs text-muted-foreground">{ui(lang,"Título","Título")}<input value={data.title} onChange={e=>patch({title:e.target.value})} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3"/></label><label className="block text-xs text-muted-foreground">{ui(lang,"Introducción","Introdução")}<textarea rows={3} value={data.subtitle} onChange={e=>patch({subtitle:e.target.value})} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"/></label></div>
      <div className="grid gap-4 lg:grid-cols-2">{data.items.map((item,i)=><div key={i} className={`rounded-2xl border p-5 space-y-4 ${i===0?"border-primary/40 bg-primary/5":"border-border bg-card"}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{i===0?ui(lang,"Área destacada","Área destacada"):`${ui(lang,"Área","Área")} ${i+1}`}</span><button onClick={()=>remove(i)} className="text-xs text-destructive">{ui(lang,"Eliminar","Excluir")}</button></div><input value={item.title} onChange={e=>patchItem(i,{title:e.target.value})} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 font-semibold"/><textarea rows={4} value={item.description} onChange={e=>patchItem(i,{description:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"/><label className="block text-xs text-muted-foreground">{ui(lang,"Materias — una por línea","Matérias — uma por linha")}<textarea rows={7} value={(item.matters??[]).join("\n")} onChange={e=>patchItem(i,{matters:e.target.value.split("\n").map(v=>v.trim()).filter(Boolean)})} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"/></label></div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={add} className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold">+ {ui(lang,"Nueva área","Nova área")}</button><div className="flex items-center gap-3">{saved&&<span className="text-xs text-primary">✓ {ui(lang,"Guardado","Salvo")}</span>}<button onClick={save} disabled={saving} className="min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving?ui(lang,"Guardando…","Salvando…"):ui(lang,"Guardar áreas","Salvar áreas")}</button></div></div>
    </div>

    <div className="border-t border-border pt-8">
      <ProfessionalsAdmin lang={lang} />
    </div>
  </div>;
}
