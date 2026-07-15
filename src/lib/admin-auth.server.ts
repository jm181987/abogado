// Helper server-only para verificar admin desde el token del request.
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

export function getAdminSupabase() {
  return createClient(
    process.env.APP_SUPABASE_URL!,
    process.env.APP_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const auth = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("No autenticado");
  const token = auth.slice(7);
  const admin = getAdminSupabase();
  const { data: userRes, error } = await admin.auth.getUser(token);
  if (error || !userRes.user) throw new Error("Sesión inválida");
  const { data: role } = await admin.rpc("has_role", { _user_id: userRes.user.id, _role: "admin" });
  if (!role) throw new Error("Sin permisos de administrador");
  return { userId: userRes.user.id };
}
