import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://viczgilshgsqtbbvykgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__3LETC6gpD6gI6g5_N6ryw_iAgJ6emf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
