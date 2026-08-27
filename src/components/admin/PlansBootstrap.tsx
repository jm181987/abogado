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

  return null;
}
