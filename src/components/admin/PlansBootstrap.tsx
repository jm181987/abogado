import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/lib/site-content";

export function PlansBootstrap() {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: es } = useSiteContent("es");
  const { data: pt } = useSiteContent("pt");
  const ran = useRef(false);

  useEffect(() => {
    if (window.location.pathname !== "/admin" || authLoading || !isAdmin || !es || !pt || ran.current) return;
    ran.current = true;

    void (async () => {
      const { data, error } = await supabase.from("plans").select("id").limit(1);
      if (error) {
        console.warn("[plans bootstrap] No se pudo verificar la tabla de planes", error);
        return;
      }
      if (data?.length) return;

      const esItems = Array.isArray(es.plans?.items) ? es.plans.items : [];
      const ptItems = Array.isArray(pt.plans?.items) ? pt.plans.items : [];
      if (!esItems.length) return;

      const rows = esItems.map((item, index) => {
        const ptItem = ptItems[index] ?? item;
        return {
          name: item.name,
          name_es: item.name,
          name_pt: ptItem.name,
          age_es: item.age,
          age_pt: ptItem.age,
          price: item.price,
          old_price: item.old || "",
          features_es: item.features ?? [],
          features_pt: ptItem.features ?? item.features ?? [],
          popular: "popular" in item ? Boolean(item.popular) : false,
          active: true,
          sort_order: index + 1,
        };
      });

      const { error: insertError } = await supabase.from("plans").insert(rows as any);
      if (insertError) {
        console.warn("[plans bootstrap] No se pudieron importar los planes visibles", insertError);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["site_content"] });
    })();
  }, [authLoading, isAdmin, es, pt, queryClient]);

  useEffect(() => {
    if (window.location.pathname !== "/admin" || authLoading || !isAdmin) return;

    const refreshPlansTab = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("header nav button"));
      const contentButton = buttons.find((button) => button.textContent?.trim() === "Contenido");
      const plansButton = buttons.find((button) => button.textContent?.trim() === "Planes");
      contentButton?.click();
      window.setTimeout(() => plansButton?.click(), 40);
    };

    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const text = button.textContent?.trim() ?? "";

      if (text === "+ Nuevo plan") {
        event.preventDefault();
        event.stopPropagation();

        void (async () => {
          const { data } = await supabase.from("plans").select("sort_order").order("sort_order", { ascending: false }).limit(1);
          const nextOrder = ((data?.[0] as any)?.sort_order ?? 0) + 1;
          const { error } = await supabase.from("plans").insert({
            name: "Nuevo plan",
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
            alert("Error creando plan: " + error.message);
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ["site_content"] });
          refreshPlansTab();
        })();
        return;
      }

      if (text === "Guardar" || text === "Eliminar") {
        window.setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: ["site_content"] });
        }, 800);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [authLoading, isAdmin, queryClient]);

  return null;
}
