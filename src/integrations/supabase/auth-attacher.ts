import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Adjunta el bearer token de Supabase a cada llamada a server function.
 * Solo se ejecuta en el navegador; en SSR no hay sesión.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return next({
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // sin sesión, continúa sin header
  }
  return next();
});
