import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tkewqahjkkrkzvafmljh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_57_-8I-uhhJGr_VZrtX_4g_aTms68vd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
